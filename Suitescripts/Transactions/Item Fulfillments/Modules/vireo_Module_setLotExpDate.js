/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/**
 * File name: vireo_Module_setLotExpDate.js
 * Author           Date       Version               Remarks
 * nagendrababu  20th Aug 2024  1.00        Initial creation of the script
 */

/* global define,log */

define(['N/search', 'N/format'], (search, format) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------ Set Lot Exp Date - Begin ------------------------ */
  const setLotExpDate = (scriptContext) => {
    const loggerTitle = 'Set Lot Exp Date';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    try {
      if (
        scriptContext.type === scriptContext.UserEventType.CREATE ||
        scriptContext.type === scriptContext.UserEventType.EDIT
      ) {
        const ifRecord = scriptContext.newRecord;
        //
        const ifRecordInternalId = ifRecord.id;

        // Retrieve Item Inventory Details
        const itemLotInfo = retrieveItemInventoryDetails(ifRecordInternalId);
        //

        const ifLineCount = ifRecord.getLineCount({ sublistId: 'item' });

        // Line Count
        for (let index = 0; index < ifLineCount; index++) {
          let expDate = '';
          let lotNumber = '';

          // Item ID
          const itemId = ifRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: index,
          });

          // Location
          const location = ifRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'location',
            line: index,
          });

          // Quantity
          const quantity = ifRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: index,
          });

          log.debug(loggerTitle, { itemId, location, quantity });

          // Find all matching lot info from pre-fetched results
          const matchingLotInfos = itemLotInfo.filter(
            (lot) =>
              lot.itemId == itemId &&
              lot.location == location &&
              lot.quantity == quantity
          );

          if (matchingLotInfos.length > 0) {
            // Iterate over the matching lots
            matchingLotInfos.forEach((matchingLotInfo, idx) => {
              if (matchingLotInfo.expDate) {
                // Set Expiration Date and Lot Number
                expDate +=
                  matchingLotInfo.expDate +
                  (idx < matchingLotInfos.length - 1 ? ', ' : '');
                lotNumber +=
                  matchingLotInfo.lotNumber +
                  (idx < matchingLotInfos.length - 1 ? ', ' : '');

                log.debug(loggerTitle, `Found matching exp date: ${expDate}`);
                log.debug(
                  loggerTitle,
                  `Found matching Lot Number: ${lotNumber}`
                );
              }
            });

            ifRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_vireo_lot_exp_date',
              line: index,
              value: expDate,
            });

            ifRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_vireo_lot_serial_number',
              line: index,
              value: lotNumber,
            });
          }
        }

        //
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ------------------------- Set Lot Exp Date - End ------------------------- */
  //
  /* ------------------------ Helper Functions - Begin ------------------------ */
  //
  /* *********************** Retrieve Item Inventory Details - Begin *********************** */
  /**
   *
   * @param {Number} id
   * @returns {Array} resultsArr
   */
  const retrieveItemInventoryDetails = (id) => {
    const loggerTitle = 'Retrieve Item Inventory Details';
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Entry--------<|');
    //
    const resultsArr = [];
    try {
      var transactionSearchObj = search.create({
        type: 'transaction',
        settings: [{ name: 'consolidationtype', value: 'ACCTTYPE' }],
        filters: [
          ['internalidnumber', 'equalto', id],
          'AND',
          ['item', 'noneof', '@NONE@'],
          'AND',
          ['inventorydetail.expirationdate', 'isnotempty', ''],
        ],
        columns: [
          search.createColumn({
            name: 'expirationdate',
            join: 'inventoryDetail',
            label: 'Expiration Date',
          }),
          search.createColumn({
            name: 'inventorynumber',
            join: 'inventoryDetail',
            label: ' Number',
          }),
          search.createColumn({
            name: 'internalid',
            join: 'inventoryDetail',
            label: 'Internal ID',
          }),
          search.createColumn({
            name: 'item',
            join: 'inventoryDetail',
            label: 'Item',
          }),
          search.createColumn({ name: 'quantity', label: 'Quantity' }),
          search.createColumn({ name: 'location', label: 'Location' }),
          search.createColumn({
            name: 'inventorynumber',
            join: 'inventoryDetail',
            label: 'Number',
          }),
        ],
      });
      var searchResultCount = transactionSearchObj.runPaged().count;
      log.debug('transactionSearchObj result count', searchResultCount);
      transactionSearchObj.run().each((result) => {
        const resultObj = {};

        // Item ID
        resultObj.itemId = result.getValue({
          name: 'item',
          join: 'inventoryDetail',
          label: 'Item',
        });

        // Expiration Date
        resultObj.expDate = result.getValue({
          name: 'expirationdate',
          join: 'inventoryDetail',
          label: 'Expiration Date',
        });

        // Quantity
        resultObj.quantity = result.getValue({
          name: 'quantity',
          label: 'Quantity',
        });

        // Location
        resultObj.location = result.getValue({
          name: 'location',
          label: 'Location',
        });

        // Lot Serial Number
        resultObj.lotNumber = result.getText({
          name: 'inventorynumber',
          join: 'inventoryDetail',
          label: 'Number',
        });

        // Push the result object to results Arr
        resultsArr.push(resultObj);

        return true;
      });
      //
      log.debug(loggerTitle + ' Results Array ', resultsArr);
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(loggerTitle, '|>--------' + loggerTitle + ' -Exit--------<|');
    return resultsArr;
  };
  /* *********************** Retrieve Item Inventory Details - End *********************** */
  //
  /* ------------------------ Helper Functions - End ------------------------ */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = setLotExpDate;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
