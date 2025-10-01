/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name: vireo_Module_setLastTransferPrice.js
 * Author           Date       Version               Remarks
 * nagendrababu 09.28.2025     1.00        Initial creation of the script
 *
 */

/* global define,log */

define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* --------------------- Set Last Transfer Price - Begin -------------------- */
  /**
   * User Event beforeSubmit handler
   * Updates Last Transfer Price (custitem_vireo_last_transf_price)
   * whenever Purchase Price (Intercompany) = "cost" is changed.
   *
   * @param {UserEventContext} context
   */
  const setLastTransferPrice = (context) => {
    const loggerTitle = 'Set Last Transfer Price';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      // ✅ Only trigger on EDIT
      if (context.type !== context.UserEventType.EDIT) {
        log.debug(
          loggerTitle,
          `Skipping execution. Context type: ${context.type}`
        );
        return;
      }

      const newRec = context.newRecord;
      const itemId = newRec.id;

      // ✅ 1. Get new Purchase Price (Intercompany)
      const costNew = newRec.getValue({ fieldId: 'cost' });

      // ✅ 2. Get old cost value from system notes (most recent change)
      let costOld = null;
      const notesSearch = search.create({
        type: 'assemblyitem',
        filters: [
          ['internalidnumber', 'equalto', itemId],
          'AND',
          ['systemnotes.field', 'anyof', 'INVTITEM.RENTEREDCOST'],
        ],
        columns: [
          search.createColumn({ name: 'oldvalue', join: 'systemnotes' }),
          search.createColumn({ name: 'newvalue', join: 'systemnotes' }),
          search.createColumn({
            name: 'date',
            join: 'systemnotes',
            sort: search.Sort.DESC,
          }),
        ],
      });

      const result = notesSearch.run().getRange({ start: 0, end: 1 })[0];
      if (result) {
        costOld = result.getValue({ name: 'oldvalue', join: 'systemnotes' });
        log.debug(loggerTitle, `System notes old cost found: ${costOld}`);
      }

      // ✅ 3. Get current Last Transfer Price
      const lastTransferPrice = newRec.getValue({
        fieldId: 'custitem_vireo_last_transf_price',
      });

      // ✅ 4. Normalize values to numbers for reliable comparison
      const numCostOld = costOld ? parseFloat(costOld) : null;
      const numCostNew = costNew ? parseFloat(costNew) : null;
      const numLastTransfer = lastTransferPrice
        ? parseFloat(lastTransferPrice)
        : null;

      log.debug(loggerTitle, {
        numCostOld,
        numCostNew,
        numLastTransfer,
      });

      // ✅ 5. Update only if cost changed
      if (
        numCostOld !== null &&
        numCostNew !== null &&
        numCostNew !== numCostOld &&
        (numLastTransfer === null || numLastTransfer !== numCostOld)
      ) {
        record.submitFields({
          type: record.Type.LOT_NUMBERED_ASSEMBLY_ITEM,
          id: itemId,
          values: {
            custitem_vireo_last_transf_price: numCostOld,
          },
        });
        log.audit(
          loggerTitle,
          `Updated Last Transfer Price on item ${itemId} → ${numCostOld}`
        );
      } else {
        log.debug(loggerTitle, 'No update required.');
      }
    } catch (error) {
      log.error(`${loggerTitle} caught an exception`, error);
    }

    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ---------------------- Set Last Transfer Price - End --------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.afterSubmit = setLastTransferPrice;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
