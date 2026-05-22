/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: vireo_MR_deleteMemorizedTransactions.js
 * Script: VIREO | MR Delete Memorized Transactions
 * Author           Date       Version               Remarks
 * Nagendra Babu  05.22.2026      1.00     Initial creation of the script to delete memorized transaction records.
 *
 */

/* global define,log*/

define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const SAVED_SEARCH_ID = 'customsearch_t_o_mt_hcpot';
  /* ------------------------- Global Variables - End ------------------------- */

  /* ------------------------- Get Input Data - Begin ------------------------- */
  /**
   * Retrieves the input data for the Map/Reduce script by loading a saved search.
   * @returns {N/search.Search} The search object containing memorized transaction records.
   */
  const getInputData = () => {
    const loggerTitle = 'Get Input Data';
    log.audit(
      loggerTitle,
      `|>-------------------${loggerTitle} -Entry-------------------<|`,
    );

    try {
      const memorizedTransactionSearch = search.load({
        id: SAVED_SEARCH_ID,
      });
      log.audit(
        loggerTitle,
        `Successfully loaded saved search: ${SAVED_SEARCH_ID}`,
      );
      return memorizedTransactionSearch;
    } catch (error) {
      log.error(
        loggerTitle,
        `Error loading saved search ${SAVED_SEARCH_ID}: ${error.message}`,
      );
      throw error; // Re-throw the error to halt script execution if input data cannot be retrieved
    }
  };
  /* ------------------------- Get Input Data - End ------------------------- */

  /* -------------------------- Reduce Phase - Begin -------------------------- */
  /**
   * Processes each memorized transaction record to delete it.
   * @param {object} reduceContext - The context object for the reduce phase.
   * @param {string} reduceContext.key - The internal ID of the memorized transaction record.
   * @param {Array<string>} reduceContext.values - An array of values associated with the key (not used in this script).
   */
  const reduce = (reduceContext) => {
    const loggerTitle = 'Reduce Phase';
    log.audit(
      loggerTitle,
      `|>-------------------${loggerTitle} -Entry-------------------<|`,
    );

    try {
      const recordId = reduceContext.key;
      log.debug(
        loggerTitle,
        `Attempting to delete Memorized Transaction record with ID: ${recordId}`,
      );

      record.delete({
        type: record.Type.MEM_DOC,
        id: recordId,
      });
      log.audit(
        loggerTitle,
        `Successfully deleted Memorized Transaction record: ${recordId}`,
      );
    } catch (error) {
      log.error(
        loggerTitle,
        `Error deleting Memorized Transaction record ${reduceContext.key}: ${error.message}`,
      );
      // Depending on requirements, you might want to re-throw or handle specific errors differently
    }

    log.audit(
      loggerTitle,
      `|>-------------------${loggerTitle} -Exit-------------------<|`,
    );
  };
  /* --------------------------- Reduce Phase - End --------------------------- */

  /* ------------------------- Summarize Phase - Begin ------------------------ */
  /**
   * Summarizes the results of the Map/Reduce script execution.
   * @param {object} summarizeContext - The context object for the summarize phase.
   * @param {number} summarizeContext.usage - The total script usage.
   * @param {number} summarizeContext.concurrency - The number of concurrent processes.
   * @param {number} summarizeContext.yields - The number of yields.
   * @param {object} summarizeContext.inputSummary - Summary of the input phase.
   * @param {object} summarizeContext.mapSummary - Summary of the map phase.
   * @param {object} summarizeContext.reduceSummary - Summary of the reduce phase.
   */
  const summarize = (summarizeContext) => {
    const loggerTitle = 'Summarize Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|',
    );
    //
    try {
      log.audit(loggerTitle, 'Summary Usage: ' + summarizeContext.usage);
      log.audit(
        loggerTitle,
        'Summary Concurrency: ' + summarizeContext.concurrency,
      );
      log.audit(loggerTitle, 'Summary Yields: ' + summarizeContext.yields);
      //
      // Log Input phase errors
      if (
        summarizeContext.inputSummary &&
        summarizeContext.inputSummary.errors
      ) {
        summarizeContext.inputSummary.errors.iterator().each((key, error) => {
          log.error(
            loggerTitle + ' Input Error',
            'Key: ' + key + ' | Error: ' + error,
          );
          return true;
        });
      }
      //
      // Log Map phase errors
      if (summarizeContext.mapSummary && summarizeContext.mapSummary.errors) {
        summarizeContext.mapSummary.errors.iterator().each((key, error) => {
          log.error(
            loggerTitle + ' Map Error',
            'Key: ' + key + ' | Error: ' + error,
          );
          return true;
        });
      }
      //
      // Log Reduce phase errors
      if (
        summarizeContext.reduceSummary &&
        summarizeContext.reduceSummary.errors
      ) {
        summarizeContext.reduceSummary.errors.iterator().each((key, error) => {
          log.error(
            loggerTitle + ' Reduce Error',
            'Key: ' + key + ' | Error: ' + error,
          );
          return true;
        });
      }
      //
      log.audit(loggerTitle, 'Map/Reduce script execution completed.');
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|',
    );
  };
  /* ------------------------- Summarize Phase - End ------------------------ */

  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
