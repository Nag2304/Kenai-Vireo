/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */

/*global define,log*/

define(['N/search', 'N/record'], (search, record) => {
  const exports = {};

  /**
   * Function to handle setting Lot Expiration Date during EDIT.
   */
  const setLotExpDateBeforeSubmit = (scriptContext) => {
    log.debug('setLotExpDateBeforeSubmit Triggered');
    handleLotExpDateLogic(scriptContext, false);
  };

  /**
   * Function to handle setting Lot Expiration Date after initial save (CREATE).
   */
  const setLotExpDateAfterSubmit = (scriptContext) => {
    log.debug('setLotExpDateAfterSubmit Triggered');
    const ifRecord = record.load({
      type: scriptContext.newRecord.type,
      id: scriptContext.newRecord.id,
      isDynamic: true, // Load in dynamic mode
    });
    handleLotExpDateLogic({ newRecord: ifRecord }, true);

    // Explicitly save the record after making changes
    ifRecord.save({
      enableSourcing: true,
      ignoreMandatoryFields: true,
    });

    log.debug('Record Saved after modifications');
  };

  const handleLotExpDateLogic = (scriptContext, isDynamic) => {
    log.debug('handleLotExpDateLogic Triggered', `Dynamic Mode: ${isDynamic}`);
    try {
      const ifRecord = scriptContext.newRecord;
      const ifLineCount = ifRecord.getLineCount({ sublistId: 'item' });
      log.debug('Number of Lines', ifLineCount);

      const itemLotInfo = retrieveItemInventoryDetails(ifRecord.id);
      log.debug('Item Lot Info Retrieved', itemLotInfo);

      for (let index = 0; index < ifLineCount; index++) {
        let expDate = '';
        let lotNumber = '';
        let quantites = '';

        const itemId = ifRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: index,
        });
        const location = ifRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'location',
          line: index,
        });
        const quantity = ifRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          line: index,
        });

        log.debug('Line Info', { itemId, location, quantity });

        const matchingLotInfos = itemLotInfo.filter(
          (lot) =>
            lot.itemId == itemId &&
            lot.location == location &&
            lot.quantity == quantity
        );
        log.debug('Matching Lot Infos', matchingLotInfos);

        if (matchingLotInfos.length > 0) {
          matchingLotInfos.forEach((matchingLotInfo, idx) => {
            if (matchingLotInfo.expDate) {
              expDate +=
                matchingLotInfo.expDate +
                (idx < matchingLotInfos.length - 1 ? ', ' : '');
              lotNumber +=
                matchingLotInfo.lotNumber +
                (idx < matchingLotInfos.length - 1 ? ', ' : '');
              quantites +=
                matchingLotInfo.lotQuantity +
                (idx < matchingLotInfos.length - 1 ? ', ' : '');
            }
          });

          if (isDynamic) {
            ifRecord.selectLine({ sublistId: 'item', line: index });
            ifRecord.setCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_vireo_lot_exp_date',
              value: expDate,
            });
            ifRecord.setCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_vireo_lot_serial_number',
              value: lotNumber,
            });
            ifRecord.setCurrentSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_vireo_lot_quantities',
              value: quantites,
            });
            ifRecord.commitLine({ sublistId: 'item' });
            log.debug('Committed Line in Dynamic Mode', {
              expDate,
              lotNumber,
              quantites,
            });
          } else {
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
            ifRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_vireo_lot_quantities',
              line: index,
              value: quantites,
            });
          }

          log.debug('Values Set', { expDate, lotNumber, quantites });
        }
      }
    } catch (error) {
      log.error('handleLotExpDateLogic caught an exception', error);
    }
  };

  const retrieveItemInventoryDetails = (id) => {
    log.debug('retrieveItemInventoryDetails Triggered');
    const resultsArr = [];
    try {
      var transactionSearchObj = search.create({
        type: 'transaction',
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
            label: 'Number',
          }),
          search.createColumn({
            name: 'item',
            join: 'inventoryDetail',
            label: 'Item',
          }),
          search.createColumn({ name: 'quantity', label: 'Quantity' }),
          search.createColumn({ name: 'location', label: 'Location' }),
          search.createColumn({
            name: 'quantity',
            join: 'inventoryDetail',
            label: 'Item',
          }),
        ],
      });

      transactionSearchObj.run().each((result) => {
        const lotInfo = {
          itemId: result.getValue({ name: 'item', join: 'inventoryDetail' }),
          expDate: result.getValue({
            name: 'expirationdate',
            join: 'inventoryDetail',
          }),
          quantity: result.getValue({ name: 'quantity' }),
          location: result.getValue({ name: 'location' }),
          lotNumber: result.getText({
            name: 'inventorynumber',
            join: 'inventoryDetail',
          }),
          lotQuantity: result.getValue({
            name: 'quantity',
            join: 'inventoryDetail',
          }),
        };
        resultsArr.push(lotInfo);
        log.debug('Lot Info', lotInfo);
        return true;
      });
    } catch (error) {
      log.error('retrieveItemInventoryDetails caught an exception', error);
    }
    return resultsArr;
  };

  exports.beforeSubmit = setLotExpDateBeforeSubmit;
  exports.afterSubmit = setLotExpDateAfterSubmit;

  return exports;
});
