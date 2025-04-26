/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: vireo_MR_updateActionFields.js
 * Script: VIREO | MR Update Action Fields
 * Author           Date       Version               Remarks
 * nagendrababu 04.25.2025      1.00     Initial creation of the script
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const action = 'TEMPLATE_ONLY';
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    return search.create({
      type: 'memdoc',
      filters: [
        ['transactiontype', 'anyof', 'SalesOrd'],
        'AND',
        ['isinactive', 'is', 'F'],
        'AND',
        ['transaction.mainline', 'is', 'T'],
        'AND',
        ['action', 'anyof', 'AUTOMATIC'],
      ],
      columns: [
        search.createColumn({
          name: 'transactiontype',
          label: 'Transaction Type',
        }),
        search.createColumn({ name: 'nextdate', label: 'Next Date' }),
        search.createColumn({ name: 'name', label: 'Name' }),
        search.createColumn({ name: 'action', label: 'Action' }),
        search.createColumn({ name: 'timeperiod', label: 'Time Period' }),
        search.createColumn({ name: 'repeatevery', label: 'Repeat Every' }),
        search.createColumn({
          name: 'numberremaining',
          label: 'Number Remaining',
        }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* -------------------------- Reduce Phase - Begin -------------------------- */
  /**
   *
   * @param {object} reduceContext
   */
  const reduce = (reduceContext) => {
    const loggerTitle = 'Reduce Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      // Key
      const key = reduceContext.key;
      log.debug(loggerTitle, 'Reduce Context Key: ' + key);
      //
      // Update Memorized Transaction
      record.submitFields({
        type: record.Type.MEM_DOC,
        id: key,
        values: {
          action: action,
        },
        options: {
          enableSourcing: false,
          ignoreMandatoryFields: true,
        },
      });
      log.audit(loggerTitle, `Updated Memorized Transaction: ${key}`);
      //
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* --------------------------- Reduce Phase - End --------------------------- */
  //
  /* ------------------------- Summarize Phase - Begin ------------------------ */
  /**
   *
   * @param {object} summarizeContext
   */
  const summarize = (summarizeContext) => {
    const loggerTitle = 'Summarize Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      log.audit(
        loggerTitle + ' Usage',
        'Summary Usage: ' + summarizeContext.usage
      );
      log.audit(
        loggerTitle + ' Concurrency',
        'Summary Concurrency: ' + summarizeContext.concurrency
      );
      log.audit(
        loggerTitle + ' Yields',
        'Summary Yields: ' + summarizeContext.yields
      );
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ------------------------- Summarize Phase - End ------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
