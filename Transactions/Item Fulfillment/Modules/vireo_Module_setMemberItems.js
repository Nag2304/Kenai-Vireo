/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name: vireo_Module_setMemberItems.js
 * Author           Date       Version               Remarks
 * nagendrababu  05.11.2025     1.00           Initial creation of the script
 * nagendrababu        05.31.2025     1.01           Added memberBaseUnit to custcol_vireo_memberitems
 */

/**
 * User Event Script to populate Kit member items on the Item Fulfillment record.
 * Stores member item details in custcol_vireo_memberitems as pipe-delimited strings (names|descriptions|quantities|memberBaseUnits).
 */

/* global define,log */

define(['N/search'], (search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------- Set Kit Member Items - Begin ---------------------- */
  /**
   * Handles the beforeSubmit event to populate custom columns with Kit member item details.
   * @param {Object} context - The script context object.
   * @param {string} context.type - The event type (create, edit, etc.).
   * @param {record.Record} context.newRecord - The current record being processed.
   */
  const setKitMemberItems = (context) => {
    const loggerTitle = 'Set Kit Member Items';
    log.debug(
      loggerTitle,
      `|>------------------${loggerTitle}- Entry------------------<|`
    );
    try {
      // Restrict execution to CREATE and EDIT events
      if (
        ![context.UserEventType.CREATE, context.UserEventType.EDIT].includes(
          context.type
        )
      ) {
        log.debug(
          loggerTitle,
          'Skipping execution: Not a CREATE or EDIT event'
        );
        return;
      }

      // Initialize variables
      const itemFulfillment = context.newRecord;
      const lineCount = itemFulfillment.getLineCount({ sublistId: 'item' });
      log.debug(loggerTitle, `Line count: ${lineCount}`);
      if (lineCount <= 0) {
        log.debug(loggerTitle, 'No line items found. Exiting.');
        return;
      }

      const kitItems = [];

      /* ---------------- Collect Kit Items - Begin ---------------- */
      for (let i = 0; i < lineCount; i++) {
        const itemType = itemFulfillment.getSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
          line: i,
        });
        log.debug(loggerTitle, `Line ${i}: itemType=${itemType}`);

        if (itemType === 'Kit') {
          const itemId = itemFulfillment.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: i,
          });
          const quantity =
            parseFloat(
              itemFulfillment.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i,
              })
            ) || 0;
          if (!itemId) {
            log.error(
              loggerTitle,
              `Line ${i}: Missing itemId for kit item. Skipping.`
            );
            continue;
          }
          kitItems.push({
            itemId,
            quantity,
            lineIndex: i,
          });
          log.debug(
            loggerTitle,
            `Collected Kit item at line ${i}: itemId=${itemId}, quantity=${quantity}`
          );
        }
      }
      log.debug(
        loggerTitle,
        `Collected Kit items: ${JSON.stringify(kitItems)}`
      );
      if (kitItems.length === 0) {
        log.debug(loggerTitle, 'No kit items found. Exiting.');
        return;
      } else {
        itemFulfillment.setValue({
          fieldId: 'custbody_vireo_has_kit_item_members',
          value: true,
        });
      }
      /* ----------------- Collect Kit Items - End ----------------- */

      /* -------------- Process Kit Member Items - Begin -------------- */
      const itemIds = kitItems.map((item) => item.itemId);
      log.debug(loggerTitle, `Item IDs for search: ${itemIds}`);
      const memberItemsMap = searchKitMemberItems(itemIds);
      log.debug(
        loggerTitle,
        `Member items map: ${JSON.stringify(memberItemsMap)}`
      );

      kitItems.forEach(({ itemId, quantity, lineIndex }) => {
        const memberItems = memberItemsMap[itemId] || [];
        log.debug(
          loggerTitle,
          `Line ${lineIndex}: Member items for itemId ${itemId}: ${JSON.stringify(
            memberItems
          )}`
        );
        if (memberItems.length === 0) {
          log.debug(
            loggerTitle,
            `Line ${lineIndex}: No member items found for itemId ${itemId}. Setting empty value.`
          );
          itemFulfillment.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_vireo_memberitems',
            line: lineIndex,
            value: '|||', // Empty pipe-delimited string with four parts
          });
          return;
        }

        const names = [];
        const descriptions = [];
        const quantities = [];
        const memberBaseUnits = [];

        // Collect member items into arrays
        memberItems.forEach(
          ({ name, description, memberQuantity, memberBaseUnit }) => {
            const sanitizedName = (name || '').replace(/[<>]/g, (match) =>
              match === '<' ? '\\u003C' : '\\u003E'
            );
            const sanitizedDescription = (description || '').replace(
              /[<>]/g,
              (match) => (match === '<' ? '\\u003C' : '\\u003E')
            );
            const sanitizedBaseUnit = (memberBaseUnit || '').replace(
              /[<>]/g,
              (match) => (match === '<' ? '\\u003C' : '\\u003E')
            );
            const totalQuantity = quantity * memberQuantity;
            names.push(sanitizedName);
            descriptions.push(sanitizedDescription);
            quantities.push(totalQuantity);
            memberBaseUnits.push(sanitizedBaseUnit);
          }
        );

        // Convert arrays to pipe-delimited strings
        const namesString = names.join('|');
        const descriptionsString = descriptions.join('|');
        const quantitiesString = quantities.join('|');
        const memberBaseUnitsString = memberBaseUnits.join('|');

        // Combine into a single pipe-delimited string: names|descriptions|quantities|memberBaseUnits
        const combinedString = `${namesString}|${descriptionsString}|${quantitiesString}|${memberBaseUnitsString}`;

        // Set the custom column
        try {
          itemFulfillment.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_vireo_memberitems',
            line: lineIndex,
            value: combinedString,
          });
          log.debug(
            loggerTitle,
            `Set member items for line ${lineIndex} (itemId ${itemId}): ${combinedString}`
          );
        } catch (setError) {
          log.error(
            loggerTitle,
            `Line ${lineIndex}: Failed to set custcol_vireo_memberitems for itemId ${itemId}: ${setError.message}`
          );
        }
      });
      /* --------------- Process Kit Member Items - End --------------- */
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    log.debug(
      loggerTitle,
      `|>------------------${loggerTitle}- Exit------------------<|`
    );
  };
  /* ----------------------- Set Kit Member Items - End ----------------------- */
  //
  /* ------------------------ Helper Functions - Begin ------------------------ */
  //
  /* *********************** searchKitMemberItems - Begin *********************** */
  /**
   * Performs a search to retrieve Kit member item details for multiple item IDs.
   * @param {Array<number|string>} itemIds - Array of internal IDs of Kit items.
   * @returns {Object} Map of item ID to array of member item details with name, description, member quantity, and member base unit.
   */
  const searchKitMemberItems = (itemIds) => {
    const loggerTitle = 'Search KitMember Items';
    log.debug(
      loggerTitle,
      `|>------------------${loggerTitle}- Entry------------------<|`
    );
    const results = {};
    log.debug(loggerTitle, `Item IDs: ${itemIds}`);
    try {
      if (!itemIds || itemIds.length === 0) {
        log.debug(loggerTitle, 'No item IDs provided. Exiting.');
        return results;
      }

      const kitSearch = search.create({
        type: 'kititem',
        filters: [
          ['type', 'anyof', 'Kit'],
          'AND',
          ['internalid', 'anyof', itemIds],
        ],
        columns: [
          search.createColumn({
            name: 'internalid',
            label: 'Internal ID',
          }),
          search.createColumn({
            name: 'itemid',
            join: 'memberitem',
            label: 'Name',
          }),
          search.createColumn({
            name: 'salesdescription',
            join: 'memberitem',
            label: 'Description',
          }),
          search.createColumn({
            name: 'memberquantity',
            label: 'Member Quantity',
          }),
          search.createColumn({
            name: 'saleunit',
            join: 'memberItem',
            label: 'Primary Sale Unit',
          }),
        ],
      });

      let resultCount = 0;
      kitSearch.run().each((result) => {
        const itemId = result.getValue({ name: 'internalid' });
        if (!results[itemId]) results[itemId] = [];

        const name =
          result.getValue({ name: 'itemid', join: 'memberitem' }) || '';
        const description =
          result.getValue({ name: 'salesdescription', join: 'memberitem' }) ||
          '';
        const memberQuantity =
          parseFloat(result.getValue({ name: 'memberquantity' })) || 0;
        const memberBaseUnit =
          result
            .getText({ name: 'saleunit', join: 'memberItem' })
            .substr(0, 2) || '';

        results[itemId].push({
          name,
          description,
          memberQuantity,
          memberBaseUnit,
        });
        log.debug(
          loggerTitle,
          `Processed member item for itemId ${itemId}: name=${name}, description=${description}, memberQuantity=${memberQuantity}, memberBaseUnit=${memberBaseUnit}`
        );

        resultCount++;
        return true;
      });

      log.debug(loggerTitle, `Total member items processed: ${resultCount}`);
      log.debug(loggerTitle, `Search results: ${JSON.stringify(results)}`);
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    log.debug(
      loggerTitle,
      `|>------------------${loggerTitle}- Exit------------------<|`
    );
    return results;
  };
  /* *********************** searchKitMemberItems - End *********************** */
  //
  /* ------------------------- Helper Functions - End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = setKitMemberItems;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
