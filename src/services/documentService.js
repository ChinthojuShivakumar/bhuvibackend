const { Op } = require('sequelize');
const db = require('../models');

exports.generateInvoiceNumber = async (user_id, state_code, city_code, document_type = 'Invoice', transaction = null) => {
    if (!transaction) {
        throw new Error('Transaction is required for generateInvoiceNumber');
    }

    try {
        // Calculate the current financial year
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // Months are zero-based
        const currentYear = currentDate.getFullYear();
        let financialYearStart;
        let financialYearEnd;

        if (currentMonth >= 4) {
            // Financial year starts from April
            financialYearStart = currentYear;
            financialYearEnd = currentYear + 1;
        } else {
            financialYearStart = currentYear - 1;
            financialYearEnd = currentYear;
        }

        const fyStartStr = financialYearStart.toString().slice(-2);
        const fyEndStr = financialYearEnd.toString().slice(-2);
        const document_series = `${state_code}${city_code}${fyStartStr}${fyEndStr}`; // e.g., 'TGHYD2425'

        // Lock the document row to prevent concurrent updates
        let document = await db.Document.findOne({
            where: { document_type, document_series },
            transaction,
            lock: transaction.LOCK.UPDATE, // Pessimistic locking
        });

        if (!document) {
            // Create a new document series if it doesn't exist
            document = await db.Document.create(
                {
                    document_series,
                    document_type,
                    sequence: 1,
                    last_update_by: user_id,
                },
                { transaction }
            );
        } else {
            // Increment the sequence number
            document.sequence += 1;
            document.last_update_by = user_id;
            await document.save({ transaction });
        }

        // Pad the sequence with leading zeros to make it 5 digits
        const sequenceStr = document.sequence.toString().padStart(5, '0');

        // Generate the invoice number
        const invoiceNumber = `${document_series}${sequenceStr}`; // e.g., 'TG242500001'

        return invoiceNumber;
    } catch (error) {
        throw error;
    }
}
    