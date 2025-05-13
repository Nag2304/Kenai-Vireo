/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name: vireo_Module_setMemberItems.js
 * Author           Date       Version               Remarks
 * nagendrababu  05.11.2025     1.00           Initial creation of the script
 *
 */

/**
 * User Event Script to populate Kit member items in JSON format on the Item Fulfillment record's custom column 'custcol_vireo_memberitems'.
 * Executes on create or edit events, retrieves kit member details via a single search, and stores all member items in a JSON array.
 */

/* global define,log */

define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------- Set Kit Member Items - Begin ---------------------- */
  /**
   * Handles the beforeSubmit event to populate the custom column with Kit member item details.
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
      const kitItems = [];

      /* ---------------- Collect Kit Items - Begin ---------------- */
      // Step 1: Iterate through line items to collect Kit item IDs and details
      for (let i = 0; i < lineCount; i++) {
        const itemType = itemFulfillment.getSublistValue({
          sublistId: 'item',
          fieldId: 'itemtype',
          line: i,
        });

        if (itemType === 'Kit') {
          kitItems.push({
            itemId: itemFulfillment.getSublistValue({
              sublistId: 'item',
              fieldId: 'item',
              line: i,
            }),
            quantity:
              parseFloat(
                itemFulfillment.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'quantity',
                  line: i,
                })
              ) || 0,
            lineIndex: i, // Store line index for accurate updates
          });
        }
      }
      log.debug(
        loggerTitle,
        `Collected Kit items: ${JSON.stringify(kitItems)}`
      );
      /* ----------------- Collect Kit Items - End ----------------- */

      /* -------------- Process Kit Member Items - Begin -------------- */
      // Step 2: Retrieve member items for all Kit items in a single search
      const itemIds = kitItems.map((item) => item.itemId);
      const memberItemsMap = searchKitMemberItems(itemIds);
      log.debug(
        loggerTitle,
        `Member items map: ${JSON.stringify(memberItemsMap)}`
      );

      // Step 3: Process each Kit item and collect all member items
      kitItems.forEach(({ itemId, quantity, lineIndex }) => {
        const memberItems = memberItemsMap[itemId] || [];
        const kitItemDetails = [];

        // Step 4: Collect all member items for the Kit
        memberItems.forEach(({ name, description, memberQuantity }) => {
          const totalQuantity = quantity * memberQuantity;
          kitItemDetails.push({
            name,
            description,
            quantity: totalQuantity,
          });
        });

        // Step 5: Update the custom column with a JSON array of all member items
        if (kitItemDetails.length > 0) {
          itemFulfillment.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_vireo_memberitems',
            line: lineIndex,
            value: JSON.stringify(kitItemDetails, null, 2), // Pretty-print JSON array
          });
          log.debug(
            loggerTitle,
            `Set custcol_vireo_memberitems for line ${lineIndex} (itemId ${itemId}): ${JSON.stringify(
              kitItemDetails
            )}`
          );
        } else {
          log.debug(
            loggerTitle,
            `No member items found for itemId ${itemId} on line ${lineIndex}`
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
   * @returns {Object} Map of item ID to array of member item details with name, description, and member quantity.
   */
  const searchKitMemberItems = (itemIds) => {
    const loggerTitle = 'Search KitMember Items';
    log.debug(
      loggerTitle,
      `|>------------------${loggerTitle}- Entry------------------<|`
    );
    const results = {};
    log.debug(loggerTitle + ' Item Ids', itemIds);
    try {
      if (!itemIds || itemIds.length === 0) {
        log.debug(
          loggerTitle,
          `|>------------------${loggerTitle}- Exit------------------<|`
        );
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
            join: 'memberItem',
            label: 'Name',
          }),
          search.createColumn({
            name: 'salesdescription',
            join: 'memberItem',
            label: 'Description',
          }),
          search.createColumn({
            name: 'memberquantity',
            label: 'Member Quantity',
          }),
        ],
      });

      kitSearch.run().each((result) => {
        const itemId = result.getValue({ name: 'internalid' });
        if (!results[itemId]) results[itemId] = [];

        results[itemId].push({
          name: result.getValue({ name: 'itemid', join: 'memberItem' }) || '',
          description:
            result.getValue({ name: 'salesdescription', join: 'memberItem' }) ||
            '',
          memberQuantity:
            parseFloat(result.getValue({ name: 'memberquantity' })) || 0,
        });

        return true; // Continue processing remaining results
      });

      log.debug(`${loggerTitle} results `, results);
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
