import rp from 'request-promise';
import jsonxml from 'jsontoxml';
import fetch from 'node-fetch';
import fs from 'fs';

import { moveInvoiceToSugar } from './SugarCRM.js';

import { PRESTA_API_URL, PRESTA_KEY, XML_START, PRESTA_PDF_LINK, COOKIE_VALUE, prestaCartJson, prestaOrderJson, prestaCustomerJson , prestaAddressJson } from '../constants.js';

function createPrestaUser(username){
  console.log("BEGIN: createPrestaUser");
  let custObj = prestaCustomerJson;
  let currCust = custObj.prestashop.customer;
  currCust.passwd = "abcd1234";
  if(username.indexOf("@") > -1){
    let usernameFromEmail = username.substring(0, username.indexOf("@"));
    currCust.firstname = usernameFromEmail;
    currCust.lastname = usernameFromEmail;
    currCust.email = username;
  } else{
    currCust.firstname = username;
    currCust.lastname = username;
    currCust.email = username + "@prestashop.com";
  }
  custObj.prestashop.customer = currCust;
  var xml = XML_START + jsonxml(custObj);
  console.log(xml);
  let apiUrl = PRESTA_API_URL + "customers?output_format=JSON";
  let options = {
    method: "POST",
    uri: apiUrl,
    headers: {
        'authorization': PRESTA_KEY
    },
    body: xml
  };
  return rp(options)
    .then((res) => {
      console.log("END: createPrestaUser");
      let customer = JSON.parse(res).customer;
      return customer;
    });
}

function createPrestaAddress(customerId, username){
  console.log("BEGIN: createPrestaAddress");
  let custObj = prestaAddressJson;
  custObj.prestashop.address.id_customer = customerId;
  if(username.indexOf("@") > -1){
    let usernameFromEmail = username.substring(0, username.indexOf("@"));
    custObj.prestashop.address.lastname = usernameFromEmail;
    custObj.prestashop.address.firstname = usernameFromEmail;
  } else{
    custObj.prestashop.address.lastname = username;
    custObj.prestashop.address.firstname = username;
  }
  var xml = XML_START + jsonxml(custObj);
  console.log(xml);
  let apiUrl = PRESTA_API_URL + "addresses?output_format=JSON";
  let options = {
    method: "POST",
    uri: apiUrl,
    headers: {
        'authorization': PRESTA_KEY
    },
    body: xml
  };
  return rp(options)
    .then((res) => {
      console.log("END: createPrestaAddress");
      let address = JSON.parse(res).address;
      return address;
    });
}

function processPSInvoice(orderId, suiteId){
  let apiUrl = PRESTA_PDF_LINK + orderId;
  console.log("processPSInvoice: ", apiUrl);
  return fetch(apiUrl).then((res) => {
    return res.buffer();
  });
}

function fetchPSOrder(orderId){
  let apiUrl = PRESTA_API_URL + "orders/"+orderId+"?output_format=JSON";
  let options = {
    method: 'GET',
    uri: apiUrl,
    headers: {
        'authorization': PRESTA_KEY
    },
    json: true
  };
  console.log("BEGIN: fetchPSOrder: ", orderId);
  return rp(options)
    .then((res) => {
      let currOrder = res.order;
      console.log("END: fetchPSOrder: ", orderId);
      return currOrder;
    });
}

function fetchPSProduct(productId){
  let apiUrl = PRESTA_API_URL + "products/"+productId+"?output_format=JSON";
  let options = {
    method: 'GET',
    uri: apiUrl,
    headers: {
        'authorization': PRESTA_KEY
    },
    json: true
  };
  console.log("BEGIN: fetchPSProduct: ", productId);
  return rp(options)
    .then((res) => {
      let response = res.product;
      var associations = response.associations;
      if(associations){
        var combinations = associations.combinations;
        if(combinations && combinations.length>0){
          response.attributeId = combinations[0].id;
        }
      }
      let price = parseFloat(response.price);
      response.price = price.toFixed(2);
      response.actualPrice = price;
      response.quantity = 0;
      response.totalPrice = 0;
      console.log("END: fetchPSProduct: ", response.id);
      return response;
    });
}

function fetchPSProductList(){
  let apiUrl = PRESTA_API_URL + "products/?output_format=JSON";
  let options = {
    method: 'GET',
    uri: apiUrl,
    headers: {
        'authorization': PRESTA_KEY
    },
    json: true
  };
  return rp(options)
    .then((res) => {
      let response = res.products;
      return response;
    });
}

function fetchPSCategory(categoryId){
  let apiUrl = PRESTA_API_URL + "categories/"+categoryId+"?output_format=JSON";
  let options = {
    method: 'GET',
    uri: apiUrl,
    headers: {
        'authorization': PRESTA_KEY
    },
    json: true
  };
  console.log("BEGIN: fetchPSCategory: ", categoryId);
  return rp(options)
    .then((res) => {
      let response = res.category;
      console.log("END: fetchPSCategory: ", response.id);
      return response;
    });
}

function fetchPSCategoryList(arg){
  let apiUrl = PRESTA_API_URL + "categories/?output_format=JSON";
  let options = {
    method: 'GET',
    uri: apiUrl,
    headers: {
        'authorization': PRESTA_KEY
    },
    json: true
  };
  console.log("BEGIN: fetchPSCategoryList");
  return rp(options)
    .then((res) => {
      let response = res.categories;
      console.log("END: fetchPSCategoryList");
      return response;
    });
}

export { createPrestaUser, createPrestaAddress, processPSInvoice, fetchPSOrder, fetchPSProduct, fetchPSProductList, fetchPSCategory, fetchPSCategoryList };
