// src/services/channelPartnerService.js
const e = require('express');
const db = require('../models');
const utils = require('../utils/utils');
const { Op } = require('sequelize');


exports.addChannelPartner = async (channel_partner_category_id, user_type_mapping_id, parent_channel_partner_id, transaction) => {
    try {
        const userTypeMapping = await db.UserTypeMapping.findByPk(user_type_mapping_id, {
            transaction: transaction
        });
        
        const user_id = userTypeMapping.user_id;
        const referral_code = utils.generateReferralCode(user_id);

        const channelPartner = await db.ChannelPartner.create({
            channel_partner_category_id,
            user_type_mapping_id,
            user_id,
            parent_channel_partner_id,
            referral_code
        }, {
            transaction: transaction
        });

        return channelPartner;

    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}


exports.addChannelPartnerByAdmin = async (user_type_mapping_id) => {
    const transaction = await db.sequelize.transaction();

    try {
        const channelPartner = await this.addChannelPartner(3, user_type_mapping_id, null, transaction);

        await transaction.commit();
        return channelPartner;

    } catch (error) {
        await transaction.rollback();
        console.error(error);
        throw new Error(error);
    }
}


exports.addChannelPartnerByReferenceCode = async (user_type_mapping_id, referral_code, transaction) => {
    try {
        const parentChannelPartner = await db.ChannelPartner.findOne({ 
            where: { referral_code },
            transaction: transaction
        });

        const { channel_partner_id: parent_channel_partner_id, user_id, total_referred } = parentChannelPartner;
        parentChannelPartner.total_referred = (total_referred || 0) + 1;

        await parentChannelPartner.save({ transaction });

        const channelPartner = await this.addChannelPartner(1, user_type_mapping_id, parent_channel_partner_id, transaction);

        await db.User.update({
            referred_by: user_id
        }, {
            where: { user_id: channelPartner.user_id },
            transaction: transaction
        });

        return channelPartner;

    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}


// returns channel_partner_id of all the parents along with the input channel_partner_id
exports.getAllParents = async (channel_partner_id, options = {}) => {
    const { transaction } = options;
    try {
        const query = `
            SELECT 
                @r AS id, 
                (SELECT @r := parent_channel_partner_id
                 FROM channel_partner
                 WHERE channel_partner_id = id
                ) AS parent_channel_partner_id,
                @l := @l + 1 AS level
            FROM
                (SELECT @r := :channel_partner_id, @l := 0) val, channel_partner
            WHERE 
                @r <> 0;
        `;

        const results = await db.sequelize.query(query, {
            type: db.sequelize.QueryTypes.SELECT,
            replacements: { channel_partner_id },
            transaction, // Use transaction if provided
        });

        const channelPartnerIdList = results.map((result) => result.id);

        return channelPartnerIdList;

    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
};


exports.getAllChildren = async (channel_partner_id) => {
    try {
        const query = `
        SELECT 
            @r AS id, 
            (SELECT @r := GROUP_CONCAT(channel_partner_id)
            FROM channel_partner
            WHERE FIND_IN_SET(parent_channel_partner_id, @r) > 0
            ) AS child_channel_partner_ids,
            @l := @l + 1 AS level
        FROM
            (SELECT @r := CAST(${channel_partner_id} AS CHAR), @l := 0) val, channel_partner
        WHERE 
            @r IS NOT NULL;
        `;

        const result = await db.sequelize.query(query, {
            type: db.sequelize.QueryTypes.SELECT,
        });

        let channelPartnerIdsList = [];

        // Extracting the 'id' field and splitting the comma-separated values
        result.forEach(row => {
            channelPartnerIdsList = channelPartnerIdsList.concat(row.id.split(","));
        });

        // Convert to numbers and add the original channel_partner_id
        channelPartnerIdsList = channelPartnerIdsList.map(id => parseInt(id)).concat([channel_partner_id]);

        return channelPartnerIdsList;

    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}


exports.addCommissionToAllChannelPartners = async (
    commission_percent,
    channelPartnerIdList,
    package_price,
    base_channel_partner_id,
    base_parent_channel_partner_id,
    property_id,
    subscription_id,
    options = {}
) => {
    const { transaction } = options;
    try {
        const channelPartners = await db.ChannelPartner.findAll({
            include: [
                {
                    model: db.ChannelPartnerCategory,
                    attributes: [
                        'level',
                        'promotion_revenue',
                        'commission_percent',
                        'next_commission_percent',
                        'channel_partner_category_id',
                    ],
                    as: 'channelPartnerCategory',
                },
                {
                    model: db.UserTypeMapping,
                    attributes: ['user_type_id', 'user_type_mapping_id'],
                    as: 'userTypeMapping',
                },
            ],
            where: { channel_partner_id: channelPartnerIdList },
            transaction, // Use transaction if provided
        });

        const channelPartnerCategories = await db.ChannelPartnerCategory.findAll({
            attributes: ['channel_partner_category_id', 'user_type_id'],
            raw: true,
            transaction, // Use transaction if provided
        });

        const userTypeCategoryObject = {};
        for (const category of channelPartnerCategories) {
            userTypeCategoryObject[category.channel_partner_category_id] = category.user_type_id;
        }

        let channelPartnerMap = {};
        let newChannelPartnersData = [];
        // let newUserTypeMappingData = [];
        for (const channelPartner of channelPartners) {
            const {
                total_cumulative_revenue: oldTotalCumulativeRevenue,
                total_commission,
                total_cumulative_commission,
                channel_partner_id,
                user_id,
                parent_channel_partner_id,
            } = channelPartner;
            const {
                channel_partner_category_id,
                commission_percent: currentCommissionPercent,
                next_commission_percent,
                promotion_revenue,
            } = channelPartner.channelPartnerCategory;
            const { user_type_mapping_id } = channelPartner.userTypeMapping;

            const total_cumulative_revenue =
                parseFloat(oldTotalCumulativeRevenue || 0) + parseFloat(package_price);

            channelPartnerMap[channel_partner_id] = {
                total_cumulative_revenue,
                total_commission,
                total_cumulative_commission,
                channel_partner_id,
                channel_partner_category_id,
                user_type_mapping_id,
                user_id,
                currentCommissionPercent,
                parent_channel_partner_id,
            };
        }

        // Deleting the base channel partner from here because it has already been updated in the addCommissionWrapper function
        delete channelPartnerMap[base_channel_partner_id];

        let parentChannelPartnerId = base_parent_channel_partner_id;
        let commissionPercent = commission_percent;
        let channelPartnerSalesData = [];
        const base_commission_percent = commission_percent;
        const base_commission = (base_commission_percent * package_price) / 100;

        while (Object.keys(channelPartnerMap).length) {
            const channelPartnerObject = channelPartnerMap[parentChannelPartnerId];

            if (!channelPartnerObject) {
                break; // Break the loop if no channel partner is found
            }

            const {
                total_cumulative_revenue,
                total_commission: oldTotalCommission,
                total_cumulative_commission: oldTotalCumulativeCommission,
                channel_partner_id,
                channel_partner_category_id,
                user_type_mapping_id,
                user_id,
                currentCommissionPercent,
                parent_channel_partner_id,
            } = channelPartnerObject;

            const diffCommissionPercent =
                parseFloat(currentCommissionPercent) - parseFloat(commissionPercent);
            let total_commission = oldTotalCommission;
            let total_cumulative_commission = oldTotalCumulativeCommission;
            let commission_amount = 0;

            console.log('currentCommissionPercent :: ', currentCommissionPercent);
            console.log('commissionPercent :: ', commissionPercent);

            if (diffCommissionPercent > 0) {
                commission_amount = (diffCommissionPercent * package_price) / 100;

                total_commission = total_commission
                    ? parseFloat(total_commission) + parseFloat(commission_amount)
                    : parseFloat(commission_amount);
                total_cumulative_commission = total_cumulative_commission
                    ? parseFloat(total_cumulative_commission) + parseFloat(commission_amount)
                    : parseFloat(commission_amount);
            }

            newChannelPartnersData.push({
                channel_partner_id,
                total_cumulative_revenue,
                total_commission,
                total_cumulative_commission,
                channel_partner_category_id,
                user_type_mapping_id,
                user_id,
            });

            channelPartnerSalesData.push({
                base_channel_partner_id,
                channel_partner_id,
                user_type_mapping_id,
                property_id,
                subscription_id,
                package_price,
                commission_percent: diffCommissionPercent,
                commission: commission_amount,
                base_commission_percent,
                base_commission,
            });

            delete channelPartnerMap[channel_partner_id];
            parentChannelPartnerId = parent_channel_partner_id;
            commissionPercent = currentCommissionPercent;
        }

        console.log('newChannelPartnersData', newChannelPartnersData);

        // // Perform updates for the updated channel partners
        // for (const partnerData of newChannelPartnersData) {
        //     await db.ChannelPartner.update(
        //         {
        //             total_cumulative_revenue: partnerData.total_cumulative_revenue,
        //             total_commission: partnerData.total_commission,
        //             total_cumulative_commission: partnerData.total_cumulative_commission,
        //             channel_partner_category_id: partnerData.channel_partner_category_id,
        //         },
        //         {
        //             where: { channel_partner_id: partnerData.channel_partner_id },
        //             transaction, // Use transaction if provided
        //         }
        //     );
        // }
        await db.ChannelPartner.bulkCreate(newChannelPartnersData, {
            updateOnDuplicate: [
                'total_cumulative_revenue',
                'total_commission',
                'total_cumulative_commission',
                'channel_partner_category_id'
            ], // Update these fields on duplicate
            transaction, // Add transaction to the options
        });

        // if (newUserTypeMappingData.length) {
        //     await db.UserTypeMapping.bulkCreate(newUserTypeMappingData, {
        //         updateOnDuplicate: ['user_type_id'],
        //         transaction,
        //     });
        // }

        await db.ChannelPartnerSales.bulkCreate(channelPartnerSalesData, { transaction });
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
};


exports.addChannelPartnerSales = async (
    base_channel_partner_id,
    channel_partner_id,
    user_type_mapping_id,
    property_id,
    subscription_id,
    package_price,
    commission_percent,
    options = {}
) => {
    const { transaction } = options;
    try {
        const commission = (package_price * commission_percent) / 100;
        const channelPartnerSales = await db.ChannelPartnerSales.create(
            {
                base_channel_partner_id,
                channel_partner_id,
                user_type_mapping_id,
                property_id,
                subscription_id,
                package_price,
                commission_percent,
                commission,
                base_commission_percent: commission_percent,
                base_commission: commission,
            },
            { transaction } // Use transaction if provided
        );
        return channelPartnerSales;
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
};


exports.addCommissionWrapper = async (subscription, options = {}) => {
    const { transaction } = options;
    try {
        const { package_price, property_id, subscription_id } = subscription;
        const { referred_by: channel_partner_user_id } = subscription.user;

        // Fetch the channel partner with associated category
        const channelPartner = await db.ChannelPartner.findOne({
            include: [
                {
                    model: db.ChannelPartnerCategory,
                    attributes: ['level', 'promotion_revenue', 'commission_percent', 'next_commission_percent'],
                    as: 'channelPartnerCategory',
                },
            ],
            where: { user_id: channel_partner_user_id },
            transaction, // Use transaction if provided
        });

        const {
            total_commission,
            total_cumulative_commission,
            total_revenue,
            total_cumulative_revenue,
            channel_partner_id,
            user_type_mapping_id,
            parent_channel_partner_id,
        } = channelPartner;
        const { commission_percent } = channelPartner.channelPartnerCategory;

        const commission_amount = (package_price * commission_percent) / 100;

        console.error('total_revenue before :::');
        console.error(total_revenue);
        console.error('commission_amount :::');
        console.error(commission_amount);
        console.error('updated total_revenue :::');
        console.error(total_revenue + commission_amount);
        console.error('updated total_revenue with parseFloat :::');
        console.error(parseFloat(total_revenue) + parseFloat(commission_amount));

        // Update channel partner's commission and revenue
        channelPartner.total_commission = total_commission
            ? parseFloat(total_commission) + parseFloat(commission_amount)
            : parseFloat(commission_amount);
        channelPartner.total_cumulative_commission = total_cumulative_commission
            ? parseFloat(total_cumulative_commission) + parseFloat(commission_amount)
            : parseFloat(commission_amount);
        channelPartner.total_revenue = total_revenue
            ? parseFloat(total_revenue) + parseFloat(package_price)
            : parseFloat(package_price);
        channelPartner.total_cumulative_revenue = total_cumulative_revenue
            ? parseFloat(total_cumulative_revenue) + parseFloat(package_price)
            : parseFloat(package_price);

        // Add channel partner sales
        await this.addChannelPartnerSales(
            channel_partner_id,
            channel_partner_id,
            user_type_mapping_id,
            property_id,
            subscription_id,
            package_price,
            parseFloat(commission_percent),
            { transaction } // Pass transaction
        );

        // Get all parent channel partners
        const channelPartnerIdList = await this.getAllParents(channel_partner_id, { transaction });

        // Add commission to all channel partners
        await this.addCommissionToAllChannelPartners(
            commission_percent,
            channelPartnerIdList,
            package_price,
            channel_partner_id,
            parent_channel_partner_id,
            property_id,
            subscription_id,
            { transaction } // Pass transaction
        );

        // Save the updated channel partner
        await channelPartner.save({ transaction });

    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
};


exports.getDashboardData = async (channel_partner_id) => {
    try {

        const channelPartnerIds = await this.getAllChildren(channel_partner_id);

        const query = `
        SELECT
            cust.first_name AS customer_first_name,
            cust.last_name AS customer_last_name,
            cust.mobile AS customer_mobile,
            cust.user_id AS customer_id,
            cp.first_name AS added_by_first_name,
            cp.last_name AS added_by_last_name,
            cp.user_id AS channel_partner_user_id,
            utm_cust.unique_id as cust_unique_id,
            utm_base_cp.unique_id as cp_unique_id,
            chp.channel_partner_id,
            prop.property_name,
            prop.area,
            prop.is_verified,
            subs.start_date,
            subs.package_price,
            subs.tasks_created,
            subs.status AS subscription_status,
            cps.commission_percent,
            cps.commission,
            cps.base_commission_percent,
            cps.base_commission,
            (
                SELECT COUNT(DISTINCT u.user_id) 
                FROM user u 
                LEFT JOIN user_type_mapping utm ON u.user_id = utm.user_id 
                WHERE utm.user_type_id = 3 
                AND u.referred_by IN (
                    SELECT user_id 
                    FROM channel_partner 
                    WHERE channel_partner_id IN (:channelPartnerIds)
                )
            ) AS total_customers,
            (
                SELECT COUNT(DISTINCT property_id) 
                FROM property 
                WHERE user_id IN (
                    SELECT user_id 
                    FROM user 
                    WHERE referred_by IN (
                        SELECT user_id 
                        FROM channel_partner 
                        WHERE channel_partner_id IN (:channelPartnerIds)
                    )
                )
            ) AS total_properties,
            (
                SELECT COUNT(*) 
                FROM subscription 
                WHERE status = 'Active'
                AND user_id IN (
                    SELECT user_id 
                    FROM user 
                    WHERE referred_by IN (
                        SELECT user_id 
                        FROM channel_partner 
                        WHERE channel_partner_id IN (:channelPartnerIds)
                    )
                )
            ) AS total_converted,
            (
                SELECT COUNT(*) 
                FROM subscription 
                WHERE tasks_created = 1 
                AND user_id IN (
                    SELECT user_id 
                    FROM user 
                    WHERE referred_by IN (
                        SELECT user_id 
                        FROM channel_partner 
                        WHERE channel_partner_id IN (:channelPartnerIds)
                    )
                )
            ) AS total_completed
        FROM
            channel_partner_sales AS cps
        LEFT JOIN
            property AS prop ON cps.property_id = prop.property_id
        LEFT JOIN
            user AS cust ON prop.user_id = cust.user_id
        LEFT JOIN
            user AS cp ON cust.referred_by = cp.user_id
        LEFT JOIN
            user_type_mapping AS utm_cust ON cust.user_id = utm_cust.user_id AND utm_cust.user_type_id = 3
        LEFT JOIN
            channel_partner AS base_cp ON cps.base_channel_partner_id = base_cp.channel_partner_id 
        LEFT JOIN
            user_type_mapping AS utm_base_cp ON base_cp.user_type_mapping_id = utm_base_cp.user_type_mapping_id 
        LEFT JOIN
            subscription AS subs ON prop.property_id = subs.property_id
        LEFT JOIN
            channel_partner AS chp ON cp.user_id = chp.user_id
        WHERE
            cps.channel_partner_id = :channel_partner_id
        ORDER BY
            cps.property_id;
        `;

        let result = await db.sequelize.query(query, {
            replacements: {
                channelPartnerIds: channelPartnerIds,
                channel_partner_id: channel_partner_id
            },
            type: db.sequelize.QueryTypes.SELECT
        });

        if (!result.length) {

            const query2 = `
            SELECT
                cust.first_name AS customer_first_name,
                cust.last_name AS customer_last_name,
                cust.mobile AS customer_mobile,
                cust.user_id AS customer_id,
                cp.first_name AS added_by_first_name,
                cp.last_name AS added_by_last_name,
                cp.user_id AS channel_partner_user_id,
                chp.channel_partner_id,
                (
                    SELECT COUNT(DISTINCT u.user_id) 
                    FROM user u 
                    LEFT JOIN user_type_mapping utm ON u.user_id = utm.user_id 
                    WHERE utm.user_type_id = 3 
                    AND u.referred_by IN (
                        SELECT user_id 
                        FROM channel_partner 
                        WHERE channel_partner_id IN (:channelPartnerIds)
                    )
                ) AS total_customers,
                (
                    SELECT COUNT(DISTINCT property_id) 
                    FROM property 
                    WHERE user_id IN (
                        SELECT user_id 
                        FROM user 
                        WHERE referred_by IN (
                            SELECT user_id 
                            FROM channel_partner 
                            WHERE channel_partner_id IN (:channelPartnerIds)
                        )
                    )
                ) AS total_properties,
                (
                    SELECT COUNT(*) 
                    FROM subscription 
                    WHERE status = 'Active'
                    AND user_id IN (
                        SELECT user_id 
                        FROM user 
                        WHERE referred_by IN (
                            SELECT user_id 
                            FROM channel_partner 
                            WHERE channel_partner_id IN (:channelPartnerIds)
                        )
                    )
                ) AS total_converted,
                (
                    SELECT COUNT(*) 
                    FROM subscription 
                    WHERE tasks_created = 1 
                    AND user_id IN (
                        SELECT user_id 
                        FROM user 
                        WHERE referred_by IN (
                            SELECT user_id 
                            FROM channel_partner 
                            WHERE channel_partner_id IN (:channelPartnerIds)
                        )
                    )
                ) AS total_completed
            FROM
                user cust
            LEFT JOIN
                user_type_mapping utm_cust ON cust.user_id = utm_cust.user_id AND utm_cust.user_type_id = 3
            LEFT JOIN
                channel_partner chp ON cust.referred_by = chp.user_id
            LEFT JOIN
                user cp ON chp.user_id = cp.user_id
            WHERE
                chp.channel_partner_id = :channel_partner_id AND utm_cust.user_type_id = 3;
            `;

            result = await db.sequelize.query(query2, {
                replacements: {
                    channelPartnerIds: channelPartnerIds,
                    channel_partner_id: channel_partner_id
                },
                type: db.sequelize.QueryTypes.SELECT
            });
        }

        if (!result.length) {

            const query3 = `
            SELECT
                (
                    SELECT COUNT(DISTINCT u.user_id) 
                    FROM user u 
                    LEFT JOIN user_type_mapping utm ON u.user_id = utm.user_id 
                    WHERE utm.user_type_id = 3 
                    AND u.referred_by IN (
                        SELECT user_id 
                        FROM channel_partner 
                        WHERE channel_partner_id IN (:channelPartnerIds)
                    )
                ) AS total_customers,
                (
                    SELECT COUNT(DISTINCT property_id) 
                    FROM property 
                    WHERE user_id IN (
                        SELECT user_id 
                        FROM user 
                        WHERE referred_by IN (
                            SELECT user_id 
                            FROM channel_partner 
                            WHERE channel_partner_id IN (:channelPartnerIds)
                        )
                    )
                ) AS total_properties,
                (
                    SELECT COUNT(*) 
                    FROM subscription 
                    WHERE status = 'Active'
                    AND user_id IN (
                        SELECT user_id 
                        FROM user 
                        WHERE referred_by IN (
                            SELECT user_id 
                            FROM channel_partner 
                            WHERE channel_partner_id IN (:channelPartnerIds)
                        )
                    )
                ) AS total_converted,
                (
                    SELECT COUNT(*) 
                    FROM subscription 
                    WHERE tasks_created = 1 
                    AND user_id IN (
                        SELECT user_id 
                        FROM user 
                        WHERE referred_by IN (
                            SELECT user_id 
                            FROM channel_partner 
                            WHERE channel_partner_id IN (:channelPartnerIds)
                        )
                    )
                ) AS total_completed
            FROM
                channel_partner
            WHERE
                channel_partner_id = :channel_partner_id;
            `;

            result = await db.sequelize.query(query3, {
                replacements: {
                    channelPartnerIds: channelPartnerIds,
                    channel_partner_id: channel_partner_id
                },
                type: db.sequelize.QueryTypes.SELECT
            });
        }

        return result;
    } catch (error) {
        console.error("Error fetching referred customers:", error);
        throw error;
    }
}


exports.getChannelPartnerTreeData = async (parent_channel_partner_id, channel_partner_id) => {
    try {

        // const channelPartnerIds = await this.getAllChildren(parent_channel_partner_id);

        const query = `
            WITH RECURSIVE ChannelPartnerHierarchy AS (
                SELECT 
                    cp.channel_partner_id
                FROM 
                    channel_partner cp
                WHERE 
                    cp.parent_channel_partner_id = ?
                UNION ALL
                SELECT 
                    cp.channel_partner_id
                FROM 
                    channel_partner cp
                INNER JOIN 
                    ChannelPartnerHierarchy cph ON cp.parent_channel_partner_id = cph.channel_partner_id
            )
            SELECT 
                channel_partner_id
            FROM 
                ChannelPartnerHierarchy;
        `;

        const children = await db.sequelize.query(query, {
            replacements: [ channel_partner_id ],
            type: db.sequelize.QueryTypes.SELECT
        });

        let channelPartnerIds = children.map(result => result.channel_partner_id);
        channelPartnerIds.push(channel_partner_id);
        channelPartnerIds = channelPartnerIds.sort((a, b) => a - b);

        const countQuery = `
        SELECT 
            cp.user_id as channel_partner_user_id,
            cp.parent_channel_partner_id, 
            cp.channel_partner_id,
            cp.total_cumulative_revenue as revenue_generated,
            cp.total_commission as cp_commission,
            cp_user.first_name,
            cp_user.last_name,
            utmm.unique_id,
            cp_user.email,
            0 as my_commission, 
            (
            SELECT COUNT(DISTINCT user_id) 
            FROM channel_partner
            WHERE parent_channel_partner_id = cp.channel_partner_id
            ) AS num_children, 
            (
            SELECT COUNT(DISTINCT u.user_id) 
            FROM user_type_mapping utm 
            LEFT JOIN user u on utm.user_id = u.user_id 
            WHERE u.referred_by = cp.user_id AND utm.user_type_id = 3
            ) AS num_referred_customers,
            (
            SELECT COUNT(DISTINCT p.user_id) 
            FROM property p
            LEFT JOIN user u ON p.user_id = u.user_id
            WHERE u.referred_by = cp.user_id
            ) AS users_with_property, 
            (
            SELECT COUNT(p.property_id) 
            FROM property p 
            LEFT JOIN user u ON p.user_id = u.user_id 
            WHERE u.referred_by = cp.user_id
            ) AS property_added, 
            (
            SELECT COUNT(s.subscription_id) 
            FROM user u 
            LEFT JOIN subscription s on u.user_id = s.user_id 
            WHERE s.status = 'Pending' AND u.referred_by = cp.user_id
            ) AS payment_pending, 
            (
            SELECT COUNT(p.property_id) 
            FROM user u 
            LEFT JOIN property p ON u.user_id = p.user_id 
            LEFT JOIN subscription s ON p.property_id = s.property_id
            WHERE s.status = 'Active' AND p.is_verified = 0 AND u.referred_by = cp.user_id
            ) AS verification_pending, 
            (
            SELECT COUNT(s.subscription_id) 
            FROM user u 
            LEFT JOIN subscription s on u.user_id = s.user_id 
            WHERE s.tasks_created = 1 AND u.referred_by = cp.user_id
            ) AS completed
        FROM 
            channel_partner cp
        LEFT JOIN
            user cp_user ON cp.user_id = cp_user.user_id
            JOIN 
        user_type_mapping AS utmm ON cp.user_type_mapping_id = utmm.user_type_mapping_id 
        WHERE 
            cp.channel_partner_id IN (?);
        `;

        const countData = await db.sequelize.query(countQuery, {
            replacements: [channelPartnerIds],
            type: db.sequelize.QueryTypes.SELECT
        });

        const commissionQuery = `
        SELECT commission,
            base_channel_partner_id
        FROM 
            channel_partner_sales
        WHERE 
            channel_partner_id = ? AND base_channel_partner_id IN (?);
        `;

        const commissionData = await db.sequelize.query(commissionQuery, {
            replacements: [parent_channel_partner_id, channelPartnerIds],
            type: db.sequelize.QueryTypes.SELECT
        });

        const cpTreeObj = countData.reduce((acc, curr) => {
            const { channel_partner_id, num_referred_customers, users_with_property, ...rest } = curr;
            const no_property_add = num_referred_customers - users_with_property;
            acc[channel_partner_id] = { ...rest, no_property_add, num_referred_customers, channel_partner_id };
            return acc;
        }, {});

        commissionData.forEach(commissionItem => {
            const { base_channel_partner_id: cp_id, commission } = commissionItem
            cpTreeObj[cp_id].my_commission = parseFloat(cpTreeObj[cp_id].my_commission) + parseFloat(commission)
        })

        let main_channel_partner = {};

        const reverseChannelPartnerTree = [];
        for (let i = channelPartnerIds.length - 1; i > -1; i--) {
            cp_id = channelPartnerIds[i];
            parent_cp_id = cpTreeObj[cp_id].parent_channel_partner_id;

            if (parent_cp_id in cpTreeObj) {
                cpTreeObj[parent_cp_id].my_commission = parseFloat(cpTreeObj[parent_cp_id].my_commission) + parseFloat(cpTreeObj[cp_id].my_commission);
                cpTreeObj[parent_cp_id].num_children = parseInt(cpTreeObj[parent_cp_id].num_children) + parseInt(cpTreeObj[cp_id].num_children);
                cpTreeObj[parent_cp_id].num_referred_customers = parseInt(cpTreeObj[parent_cp_id].num_referred_customers) + parseInt(cpTreeObj[cp_id].num_referred_customers);
                cpTreeObj[parent_cp_id].no_property_add = parseInt(cpTreeObj[parent_cp_id].no_property_add) + parseInt(cpTreeObj[cp_id].no_property_add);
                cpTreeObj[parent_cp_id].property_added = parseInt(cpTreeObj[parent_cp_id].property_added) + parseInt(cpTreeObj[cp_id].property_added);
                cpTreeObj[parent_cp_id].payment_pending = parseInt(cpTreeObj[parent_cp_id].payment_pending) + parseInt(cpTreeObj[cp_id].payment_pending);
                cpTreeObj[parent_cp_id].verification_pending = parseInt(cpTreeObj[parent_cp_id].verification_pending) + parseInt(cpTreeObj[cp_id].verification_pending);
                cpTreeObj[parent_cp_id].completed = parseInt(cpTreeObj[parent_cp_id].completed) + parseInt(cpTreeObj[cp_id].completed);
            }
            if (parent_cp_id == channel_partner_id || cp_id == channel_partner_id) {
                reverseChannelPartnerTree.push(cpTreeObj[cp_id])
                if (cp_id == channel_partner_id) {
                    main_channel_partner = cpTreeObj[cp_id];
                }
            }
        }

        const customerQuery = `
        SELECT
            cust.first_name AS customer_first_name,
            cust.last_name AS customer_last_name,
            cust.mobile AS customer_mobile,
            cust.user_id AS customer_id,
            cust.email AS customer_email,
            cp.first_name AS added_by_first_name,
            cp.last_name AS added_by_last_name,
            chp.channel_partner_id,
            prop.property_id,
            prop.prop_unique_id,
            prop.property_name,
            prop.area,
            prop.is_verified,
            subs.start_date,
            subs.package_price,
            subs.tasks_created,
            subs.status AS subscription_status,
            utm_cust.unique_id
        FROM
            user AS cust
        JOIN
            user_type_mapping AS utm_cust ON cust.user_id = utm_cust.user_id AND utm_cust.user_type_id = 3
        JOIN
            user AS cp ON cust.referred_by = cp.user_id
        LEFT JOIN
            property AS prop ON cust.user_id = prop.user_id
        LEFT JOIN
            subscription AS subs ON prop.property_id = subs.property_id
        LEFT JOIN
            channel_partner AS chp ON cp.user_id = chp.user_id
        WHERE
            chp.channel_partner_id IN (?)
        ORDER BY
            cust.user_id, prop.property_id;
        `;

        const customerData = await db.sequelize.query(customerQuery, {
             replacements: [channel_partner_id], // Uncomment this line and comment the line below to get customer data for only main_channel_partner
            //replacements: [channelPartnerIds],
            type: db.sequelize.QueryTypes.SELECT
        });

        return { channelPartnerTree: reverseChannelPartnerTree.reverse(), customerData, main_channel_partner, 
            main_channel_partner_id: channel_partner_id, parent_channel_partner_id };
    } catch (error) {
        console.error("Error fetching referred customers:", error);
        throw error;
    }
}


exports.getChannelPartnerUniqueId = async (channel_partner_id) => {
    try {
        const unique_id_query = `
            SELECT
                utm.unique_id
            FROM
                channel_partner AS cp
            LEFT JOIN
                user_type_mapping AS utm ON cp.user_type_mapping_id = utm.user_type_mapping_id
            WHERE
                cp.channel_partner_id = ?;
        `;

        const results = await db.sequelize.query(unique_id_query, {
            replacements: [channel_partner_id],
            type: db.sequelize.QueryTypes.SELECT, // Ensure you have imported Sequelize
        });

        const channel_partner = results[0]
        const unique_id = channel_partner.unique_id
        return unique_id;
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}


exports.promoteChannelPartner = async (channel_partner_id, next_channel_partner_category_id, effective_date, promoted_by) => {
    try {
        const channelPartner = await db.ChannelPartner.findByPk(channel_partner_id);
        
        const parent_channel_partner_id = channelPartner.parent_channel_partner_id;
        const promotion = next_channel_partner_category_id > channelPartner.channel_partner_category_id ? true : false;

        if (promotion && parent_channel_partner_id) {
            const parentChannelPartner = await db.ChannelPartner.findByPk(parent_channel_partner_id);
            const failure = next_channel_partner_category_id > parentChannelPartner.channel_partner_category_id || 
            (parentChannelPartner.next_channel_partner_category_id && 
                next_channel_partner_category_id > parentChannelPartner.next_channel_partner_category_id)
            if (failure) {
                const unique_id = await this.getChannelPartnerUniqueId(parentChannelPartner.channel_partner_id)
                throw Error(`Please promote Channel Partner with CP_ID =${unique_id} first`)
            }
        } else {
            const outlier_channel_partner = await db.ChannelPartner.findOne({
                where: {
                  parent_channel_partner_id: channel_partner_id,
                  [Op.or]: [
                    {
                      channel_partner_category_id: {
                        [Op.gt]: next_channel_partner_category_id,
                      },
                    },
                    {
                      next_channel_partner_category_id: {
                        [Op.gt]: next_channel_partner_category_id,
                      },
                    },
                  ],
                },
              });
              
            if (outlier_channel_partner) {
                const outlier_channel_partner_id = outlier_channel_partner.channel_partner_id;
                const unique_id = await this.getChannelPartnerUniqueId(outlier_channel_partner_id)
                throw Error(`Channel Partner with CP_ID =${unique_id} has higher commission`)
            }
        }

        const updatedChannelPartner = await channelPartner.update({
            next_channel_partner_category_id, 
            effective_date,
            promoted_by
        })
        return updatedChannelPartner;
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}