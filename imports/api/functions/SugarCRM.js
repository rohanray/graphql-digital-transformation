import rp from 'request-promise';
import sugar from 'node-sugarcrm-client';

import { SUGAR_API_URL, SUGAR_USERNAME, SUGAR_PASSWORD } from '../constants.js';

function sugarLogin() {
  let params = {
    user_auth:{
        user_name: SUGAR_USERNAME,
        password: SUGAR_PASSWORD,
        encryption: "PLAIN"
    },
    application: "SugarCRM RestAPI Example"
  };
  let json = JSON.stringify(params);
  let body = { method: "login", input_type: "JSON", response_type: "JSON", rest_data: json };
  let options = {
    method: 'POST',
    uri: SUGAR_API_URL,
    qs: body,
    json: true
  };
  console.log("BEGIN: sugarLogin");
  return rp(options)
    .then((res) => {
      console.log("END: sugarLogin -> ", res.id);
      return res.id;
    });
}

function fetchSugarAccounts(sessionId, query) {
  let params = {
  	session:  sessionId,
  	module_name : "Accounts",
  	query : query,
  	order_by : '',
  	offset : '0',
  	select_fields : [ 'id' ,'name'],
  	link_name_to_fields_array : [
      {name: "documents", value: [ "id", "name", "active_date", "document_revision_id" ]}
    ],
  	max_results : -1,
  	deleted : '0',
  	Favorites : false
  };
  let json = JSON.stringify(params);
  let body = { method: "get_entry_list", input_type: "JSON", response_type: "JSON", rest_data: json };
  let options = {
    method: 'POST',
    uri: SUGAR_API_URL,
    qs: body,
    json: true
  };
  return rp(options)
    .then((res) => {
      let entryList = res.entry_list;
      let newEntryList = [];
      for(let i=0; i<entryList.length; i++){
        let entry = {};
        entry.id = entryList[i].name_value_list["id"].value;
        entry.name = entryList[i].name_value_list["name"].value;
        newEntryList.push(entry);
      }

      let relList = res.relationship_list;
      for(let i=0; i<relList.length; i++){
        let currRel = relList[i];
        let docList = currRel.link_list;
        let documentList = [];
        for(let j=0; j<docList.length; j++){
          let docListRecords = docList[j].records;
          for(let k=0; k<docListRecords.length; k++){
            let docId = docListRecords[k].link_value.id.value;
            let docName = docListRecords[k].link_value.name.value;
            let docActiveDate = docListRecords[k].link_value.active_date.value;
            let docFile = docListRecords[k].link_value.document_revision_id.value;
            let document = {
              id: docId,
              name: docName,
              activeDate: docActiveDate,
              link: docFile
            };
            documentList.push(document);
          }
        }
        newEntryList[i].documents = documentList;
      }
      return newEntryList;
    });
}

function createSuiteUser(currUser, sessionId){
  console.log("Creating Account for ", currUser);
  let params = {
    session:  sessionId,
    module_name: "Accounts",
    name_value_list : [
      { name:'name', value: currUser.username }
    ]
  };
  let json = JSON.stringify(params);
  let body = { method: "set_entry", input_type: "JSON", response_type: "JSON", rest_data: json };
  let options = {
    method: 'POST',
    uri: SUGAR_API_URL,
    qs: body,
    json: true
  };
  return rp(options)
    .then((res) => {
      return res.id;
    });
}

function fetchFile(sessionId, revisionId){
  let params = {
  	session:  sessionId,
    i: revisionId
  };
  let json = JSON.stringify(params);
  let body = { method: "get_document_revision", input_type: "JSON", response_type: "JSON", rest_data: json };
  let options = {
    method: 'POST',
    uri: SUGAR_API_URL,
    qs: body,
    json: true
  };
  return rp(options)
    .then((res) => {
      if(res.document_revision){
        return res.document_revision.file;
      } else {
        return;
      }
    });
}

function createDocument(documentName, sessionId){
  let params = {
    session:  sessionId,
    module_name: "Documents",
    name_value_list : [
      { name:'document_name', value: documentName },
      { name:'revision', value: 1 },
    ]
  };
  let json = JSON.stringify(params);
  let body = { method: "set_entry", input_type: "JSON", response_type: "JSON", rest_data: json };
  let options = {
    method: 'POST',
    uri: SUGAR_API_URL,
    qs: body,
    json: true
  };
  return rp(options)
    .then((res) => {
      if(res){
        return res.id;
      } else {
        return;
      }
    });
}

function setDocRevision(base64Bitmap, documentName, documentId, sessionId){
  let params = {
    session:  sessionId,
    note : {
      id: documentId,
      file: base64Bitmap,
      filename: documentName,
      revision: 1
    }
  };
  let json = JSON.stringify(params);
  let body = { method: "set_document_revision", input_type: "JSON", response_type: "JSON", rest_data: json };
  let options = {
    method: 'POST',
    uri: SUGAR_API_URL,
    form: body,
    json: true
  };
  return rp(options)
    .then((res) => {
      if(res){
        return res.id;
      } else {
        return;
      }
    });
}

function docToAccount(documentId, customerId, sessionId){
  let params = {
    session:  sessionId,
    module_name: "Documents",
    module_id: documentId,
    link_field_name: "accounts",
    related_ids: [customerId],
    name_value_lists: [],
    delete: 0
  };
  let json = JSON.stringify(params);
  let body = { method: "set_relationship", input_type: "JSON", response_type: "JSON", rest_data: json };
  let options = {
    method: 'POST',
    uri: SUGAR_API_URL,
    qs: body,
    json: true
  };
  return rp(options)
    .then((res) => {
      if(res){
        return res;
      } else {
        return;
      }
    });
}

function moveInvoiceToSugar(base64Bitmap, documentName, customerId, sessionId){
  sugar.init({
      apiURL:  "http://suitecrm-rohanray.rhcloud.com/service/v4_1/rest.php",
      login:   SUGAR_USERNAME,
      passwd:  SUGAR_PASSWORD
  });
  sugar.login(function(sessionID){
    if (sessionID != 'undefined') {
      console.log("CREATING DOCUMENT: ", documentName, " FOR ", customerId);
      params = {
        session:  sessionID,
        module_name: "Documents",
        name_value_list : [
          { name:'document_name', value: documentName },
          { name:'revision', value: 1 },
        ]
      };
      sugar.call("set_entry", params, function(res, err){
        console.log("Sugar set_entry RESULT: ", res);
        revParams = {
          session:  sessionID,
          note : {
            id: res.id,
            file: base64Bitmap,
            filename: documentName,
            revision: 1
          }
        };
        sugar.call("set_document_revision", revParams, function(res, err){
          console.log("Sugar set_document_revision RESULT: ", res);
          console.log("Sugar set_document_revision ERROR: ", err);
        });

        relParams = {
          session:  sessionID,
          module_name: "Documents",
          module_id: res.id,
          link_field_name: "accounts",
          related_ids: [customerId],
          name_value_lists: [],
          delete: 0
        };
        sugar.call("set_relationship", relParams, function(res, err){
          console.log("Sugar set_relationship RESULT: ", res);
          console.log("Sugar set_relationship ERROR: ", err);
        });

        console.log("Sugar set_entry ERROR: ", err);
      });
    }
  });
}

export { sugarLogin, fetchSugarAccounts, createSuiteUser, fetchFile, moveInvoiceToSugar, createDocument, setDocRevision, docToAccount };
