/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define([
  'SuiteScripts/Kenai/Transactions/Item Fulfillments/Modules/vireo_Module_setLotExpDate',
  'SuiteScripts/Kenai/Transactions/Item Fulfillments/Modules/vireo_Module_setMemberItems',
], (setLotExpirationDate, setKitMemberItems) => {
  const exports = {};

  /**
   * Function that runs before the record is saved to the database.
   * This function will be executed on subsequent edits (EDIT).
   *
   * @param {object} scriptContext - Context information about the script's execution
   */
  const beforeSubmit = (scriptContext) => {
    log.debug('beforeSubmit Triggered', `Event Type: ${scriptContext.type}`);
    try {
      // if (scriptContext.type === scriptContext.UserEventType.EDIT) {
      //   log.debug('Executing beforeSubmit for EDIT');
      //   setLotExpirationDate.beforeSubmit(scriptContext);
      // }
      setKitMemberItems.beforeSubmit(scriptContext);
    } catch (error) {
      log.error('beforeSubmit caught an exception', error);
    }
  };

  /**
   * Function that runs after the record is saved to the database.
   * This function will be executed on initial creation (CREATE) to ensure values are set after the record is fully saved.
   *
   * @param {object} scriptContext - Context information about the script's execution
   */
  const afterSubmit = (scriptContext) => {
    log.debug('afterSubmit Triggered', `Event Type: ${scriptContext.type}`);
    try {
      if (
        scriptContext.type === scriptContext.UserEventType.CREATE ||
        scriptContext.type === scriptContext.UserEventType.EDIT
      ) {
        log.debug('Executing afterSubmit for CREATE');
        setLotExpirationDate.afterSubmit(scriptContext);
      }
    } catch (error) {
      log.error('afterSubmit caught an exception', error);
    }
  };

  exports.beforeSubmit = beforeSubmit;
  exports.afterSubmit = afterSubmit;

  return exports;
});
