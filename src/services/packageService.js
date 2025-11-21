const db = require("../models");
const { Op } = require("sequelize");

exports.getPackageByName = async (package_name) => {
  const package = await db.Package.findOne({
    where: {
      status: "Active",
      package_name,
      [Op.and]: [
        {
          start_date: {
            [Op.ne]: null, // start_date is NULL
          },
        },
        // {
        //     start_date: {
        //         [Op.lte]: new Date(), // start_date >= current_date
        //     },
        // },
      ],
      [Op.and]: [
        {
          end_date: {
            [Op.is]: null, // end_date is NULL
          },
        },
        // {
        //     end_date: {
        //         [Op.gte]: new Date(), // end_date <= current_date
        //     },
        // },
      ],
    },

    order: [["created_at", "DESC"]],
    limit: 1,
    offset: 0,
  });

  return package;
};

exports.getPackagePriceByArea = async (package_id, area) => {
  const package = await db.Package.findByPk(package_id);

  const slabPrices = {
    slab_1: [package.slab_1, package.package_price_1],
    slab_2: [package.slab_2, package.package_price_2],
    slab_3: [package.slab_3, package.package_price_3],
    slab_4: [package.slab_4, package.package_price_4],
    slab_5: [package.slab_5, package.package_price_5],
    slab_6: [package.slab_6, package.package_price_6],
    slab_7: [package.slab_7, package.package_price_7],
    slab_8: [package.slab_8, package.package_price_8],
    slab_9: [package.slab_9, package.package_price_9],
  };

  // let foundSlab = null;

  for (const slab in slabPrices) {
    if (slabPrices.hasOwnProperty(slab)) {
      const price = slabPrices[slab];

      if (parseInt(price[0]) > area) {
        return price[1];
      }
    }
  }
  return null;

  // const package_price = foundSlab ? slabPrices[slab][1] : null;
  // return package_price;
};
exports.getPackagePriceByAreaSlab = async (package_id, area) => {
  const package = await db.Package.findByPk(package_id);

  const slabPrices = {
    slab_1: [package.slab_1, package.package_price_1],
    slab_2: [package.slab_2, package.package_price_2],
    slab_3: [package.slab_3, package.package_price_3],
    slab_4: [package.slab_4, package.package_price_4],
    slab_5: [package.slab_5, package.package_price_5],
    slab_6: [package.slab_6, package.package_price_6],
    slab_7: [package.slab_7, package.package_price_7],
    slab_8: [package.slab_8, package.package_price_8],
    slab_9: [package.slab_9, package.package_price_9],
  };

  // let foundSlab = null;

  for (const slab in slabPrices) {
    if (slabPrices.hasOwnProperty(slab)) {
      const slab_name = slab;
      const price = slabPrices[slab];

      if (parseInt(price[0]) >= area) {
        return `${slab_name}-${price[1]}`;
      }
    }
  }
  return null;
};

exports.addPackage = async (data, user_id) => {
  const {
    package_name,
    package_price,
    package_price_1,
    package_price_2,
    package_price_3,
    package_price_4,
    package_price_5,
    package_price_6,
    package_price_7,
    package_price_8,
    package_price_9,
    description,
    status,
    package_services,
    slab_1,
    slab_2,
    slab_3,
    slab_4,
    slab_5,
    slab_6,
    slab_7,
    slab_8,
    slab_9,
    start_date,
    end_date,
    parent_id,
  } = data;

  // Create a new package
  const package = await db.Package.create({
    package_name,
    package_price,
    package_price_1,
    package_price_2,
    package_price_3,
    package_price_4,
    package_price_5,
    package_price_6,
    package_price_7,
    package_price_8,
    package_price_9,
    description,
    status,
    slab_1,
    slab_2,
    slab_3,
    slab_4,
    slab_5,
    slab_6,
    slab_7,
    slab_8,
    slab_9,
    package_services,
    created_by: user_id,
    last_update_by: user_id,
    start_date: start_date || null,
    end_date: end_date || null,
    parent_id: parent_id || null,
  });

  // Add services to the package
  // for (const package_service of package_services) {
  //     await db.PackageService.create({
  //         package_id: package.package_id,
  //         service_id: package_service.service_id,
  //         package_service_price: package_service.package_service_price,
  //         created_by: user_id,
  //         last_update_by: user_id
  //     });
  // }
  // Add services to the package
  for (const package_service of package_services) {
    await db.PackageService.create({
      package_id: package.package_id,
      service_id: package_service.service_id,
      package_service_price: null,
      created_by: user_id,
      last_update_by: user_id,
    });
  }

  return package;
};
