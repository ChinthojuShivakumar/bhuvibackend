// src/services/partnerBuilderService.js
const db = require('../models');


exports.addCompany = async (companyData) => {
    try {
        // Extract the required data from the request body
        const { company_name, address, town, mandal, city, state, country, pincode } = companyData;

        const company = await db.Company.create({
            company_name,
            address,
            town,
            mandal,
            city,
            state,
            country,
            pincode
        });

        return company

    } catch (error) {
        console.error(error);
        throw new Error(error);
        // throw new Error('Failed to create company');
    }
};


exports.addPartnerBuilder = async (user_id, user_type_mapping_id, company_id) => {
    try {
        const partnerBuilder = await db.PartnerBuilder.create({
            user_id,
            user_type_mapping_id,
            company_id
        })

        return partnerBuilder

    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}


exports.getAllProjectsByCompanyId = async (company_id) => {
    try {
        const projects = await db.PartnerBuilderProject.findAll({where: { company_id }});

        return projects;
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}


exports.getAllCompanies = async () => {
    try {
        const companies = await db.Company.findAll();

        return companies;
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}


exports.getCommissionByArea = async (partner_builder_project_id, area, options = {}) => {
    const { transaction } = options;

    console.error('partner_builder_project_id ::', partner_builder_project_id);

    const commissionObject = await db.Commission.findOne({
        where: { partner_builder_project_id },
        transaction, // Use transaction if provided
    });

    if (!commissionObject) {
        console.error('No commission object found');
        return null;
    }

    const slabPrices = {
        slab_1: [commissionObject.slab_1, commissionObject.commission_1],
        slab_2: [commissionObject.slab_2, commissionObject.commission_2],
        slab_3: [commissionObject.slab_3, commissionObject.commission_3],
        slab_4: [commissionObject.slab_4, commissionObject.commission_4],
        slab_5: [commissionObject.slab_5, commissionObject.commission_5],
        slab_6: [commissionObject.slab_6, commissionObject.commission_6],
        slab_7: [commissionObject.slab_7, commissionObject.commission_7],
        slab_8: [commissionObject.slab_8, commissionObject.commission_8],
        slab_9: [commissionObject.slab_9, commissionObject.commission_9],
    };

    for (const slab in slabPrices) {
        if (Object.prototype.hasOwnProperty.call(slabPrices, slab)) {
            const [slabArea, slabCommission] = slabPrices[slab];

            if (parseInt(slabArea) >= area) {
                return slabCommission;
            }
        }
    }
    return null;
};