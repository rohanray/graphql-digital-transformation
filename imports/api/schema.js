import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';
import fetch from 'node-fetch';
import sugar from 'node-sugarcrm-client';
import rp from 'request-promise';
import DataLoader from 'dataloader';
import jsonxml from 'jsontoxml';
import { Category, Product, OrderHistory } from './collection.js';
import { WP_NO_IMAGE_LINK, PRESTA_API_URL, PRESTA_KEY, XML_START, prestaCartJson, prestaOrderJson } from './constants.js';
import { fetchWordPressPageByURL } from './functions/Wordpress.js';
import { sugarLogin, fetchSugarAccounts, createSuiteUser, fetchFile, moveInvoiceToSugar, createDocument, setDocRevision, docToAccount } from './functions/SugarCRM.js';
import { createPrestaUser, createPrestaAddress, processPSInvoice, fetchPSOrder, fetchPSProduct, fetchPSProductList, fetchPSCategory, fetchPSCategoryList } from './functions/PrestaShop.js';

let currentCart;

export const schema = [`
type Email {
  address: String
  verified: Boolean
}

type User {
  emails: [Email]
  username: String
  prestaId: String
  suiteId: String
}

type WordpressPage {
    slug : String
    comment_status : String
    content: String
    prestaCatId: String
}

type Document {
  id: String
  name: String
  activeDate: String
  link: String
}

type SugarPage {
	id : String
	name : String
  documents : [Document]
  lastDocLink: LastDocument
}

type LastDocument{
  revisionId : String
  docLink : String
}

type PrestaProduct {
  id: String
  name: String
  reference: String
  manufacturer_name: String
  price: String
  roundedPrice: String
  wholesale_price: String
  attributeId: String
  quantity: String
  totalPrice: String
  categoryId: String
  imageLink: String
}

type PrestaCategory {
  id: String
  name: String
  description: String
  products: [PrestaProduct]
}

type PrestaCatList {
  id: String
  prestaCategory: PrestaCategory
}

type CategoryList {
  id: String
  name: String
  description: String
}

type Cart {
  id: String
  totalPrice: String
  totalItems: String
  products: [PrestaProduct]
}

type Order {
  orderId: String
  invoice: String
  invoiceLink: String
  user: String
}

type Mapping {
  id: String
  name: String
  value: String
}

type Query {
  user (id: String!): User
  wordpressPage (id: String!) : [WordpressPage]
  sugarPage (id: String!) : [SugarPage]
  psCatList (id: String!) : [PrestaCatList]
  categoryList (id: String!) : [CategoryList]
  currCategory (id: String!) : CategoryList
  productList (id: String!) : [PrestaProduct]
  currentCart (id: String!) : Cart
  documentLink (id: String!) : String
  lastOrder (id: String!) : Order
  categoryMap (id: String!) : [Mapping]
  productMap (id: String!) : [Mapping]
}

schema {
  query: Query
}
`];

const personLoader = new DataLoader(
  urls => Promise.all(urls.map(fetchWordPressPageByURL))
);

export const resolvers = {
  Query: {
    async user(root, args, context) {
      if (args.id) {
        let meteorUser = await Meteor.users.findOne(args.id);
        if(meteorUser){
          let user = {};
          user.emails = meteorUser.emails;
          user.username = meteorUser.username;
          let userProfile = meteorUser.profile;
          if(userProfile){
            user.prestaId = userProfile.prestaCustId;
            user.suiteId = userProfile.suiteId;
          }
          return user;
        }
      }
    },
    async lastOrder(root, args, ccontext){
      let userId = args.id;
      console.log("BEGIN: resolvers -> lastOrder: ", userId);
      if(userId && userId != ""){
        let lastOrder = OrderHistory.findOne({user: userId}, {sort: {orderId: -1}});
        console.log("END: resolvers -> lastOrder", lastOrder);
        return lastOrder;
      }
      console.log("END: resolvers -> lastOrder >> No User");
    },
    async documentLink(root, args, context){
      console.log("documentLink", args.id);
      let sessionId = await sugarLogin();
      let docLink = await fetchFile(sessionId, args.id);
      return docLink;
    },
    async wordpressPage(root, args, context) {
      let pages = [];
      let categories = Category.find().fetch();
      for(let i=0; i<categories.length; i++){
        let wpPage = await personLoader.load(`/pages/${categories[i].wpPageId}`);
        // let wpPage = await fetchWordPressPageByURL(`/pages/${categories[i].wpPageId}`);
        let currPage = {};
        currPage.slug = wpPage.title.rendered;
        currPage.comment_status = wpPage.comment_status;
        currPage.content = wpPage.content.rendered;
        currPage.prestaCatId = categories[i].id;
        pages.push(currPage);
      }
      return pages;
    },
    async sugarPage(root, args, context) {
      let sessionId = await sugarLogin();
      let currUser = Meteor.users.findOne(args.id);
      if(currUser && currUser.profile && currUser.profile.suiteId){
        let query = "accounts.id='"+currUser.profile.suiteId+"'";
        return await fetchSugarAccounts(sessionId, query);
      }
    },
    async psCatList(root, args, context) {
      return await fetchPSCategoryList(args.id);
    },
    async categoryList(root, args, context) {
      let catList = await fetchPSCategoryList(args.id);
      let finalCatList = [];
      for(let i=0; i<catList.length; i++){
        let currCategory = await fetchPSCategory(catList[i].id);
        if(currCategory.associations && currCategory.associations.products)
          finalCatList.push(currCategory);
      }
      return finalCatList;
    },
    async currCategory(root, args, context){
      let currCategory = await fetchPSCategory(args.id);
      let wpMap = Category.findOne({id: currCategory.id + ""});
      let currDescription = "";
      if(wpMap){
        let wpPage = await personLoader.load(`/pages/${wpMap.wpPageId}`);
        if(wpPage && wpPage.content){
          currDescription = wpPage.content.rendered;
        }
      }
      return {id: currCategory.id, name: currCategory.name, description: currDescription}
    },
    async productList(root, args, context) {
      let category = await fetchPSCategory(args.id);
      if(category){
        console.log("BEGIN: resolvers -> PrestaCategory: products", category.id);
        let products = [];
        if(category.associations && category.associations.products){
          let assocProducts = category.associations.products;
          for(let i=0; i<assocProducts.length; i++){
            let currProductId = assocProducts[i].id;
            let currProduct = await fetchPSProduct(currProductId);
            let productMap = Product.findOne({id: currProductId})
            if(productMap){
              currProduct.imageLink = productMap.imageLink;
            } else{
              currProduct.imageLink = WP_NO_IMAGE_LINK;
            }
            currProduct.categoryId = args.id
            products.push(currProduct);
          }
        }
        console.log("END: resolvers -> PrestaCategory: products", category.id);
        return products;
      } else{
        console.log("WARN: resolvers -> PrestaCategory: products > Category is null");
      }
    },
    async currentCart(root, args, context) {
      console.log("BEGIN: resolvers -> currentCart: ", currentCart);
      if(currentCart){
        let cartObj = JSON.parse(currentCart);
        let products = [];
        let cartRows = cartObj.cart.associations.cart_rows;
        let totalCartPrice = 0.0;
        let totalCartItems = 0;
        for(let i=0; i<cartRows.length; i++){
          let productObj = await fetchPSProduct(cartRows[i].id_product);
          productObj.quantity = cartRows[i].quantity;
          productObj.totalPrice = (cartRows[i].quantity * productObj.price).toFixed(2);
          totalCartPrice = parseFloat(parseFloat(totalCartPrice) + parseFloat(productObj.totalPrice));
          totalCartItems++;
          products.push(productObj);
        }
        console.log("HERE", products, totalCartPrice, totalCartItems);
        let finalCart = {};
        finalCart.id = cartObj.cart.id;
        finalCart.fetchedProducts = products;
        finalCart.totalPrice = parseFloat(totalCartPrice).toFixed(2);
        finalCart.totalItems = totalCartItems;
        return finalCart;
      }
      console.log("END: resolvers -> currentCart");
    },
    async categoryMap(root, args, context) {
      let catList = await fetchPSCategoryList(args.id);
      let finalCatList = [];
      for(let i=0; i<catList.length; i++){
        let category = await fetchPSCategory(catList[i].id);
        if(category && category.associations && category.associations.products){
          let currMap = Category.findOne({id: catList[i].id + ""});
          if(currMap){
            catList[i].value = currMap.wpPageId;
          }
          catList[i].name = category.name;
          finalCatList.push(catList[i]);
        }
      }
      return finalCatList;
    },
    async productMap(root, args, context) {
      let productList = await fetchPSProductList();
      for(let i=0; i<productList.length; i++){
        let currProductId = productList[i].id;
        let currProduct = await fetchPSProduct(currProductId);
        if(currProduct){
          let currMap = Product.findOne({id: currProductId + ""});
          if(currMap){
            productList[i].value = currMap.imageLink;
          }
          productList[i].name = [currProduct.name, "(", currProduct.reference, ")"].join("");
        }
      }
      return productList;
    },
  },
  User: {
    emails: ({emails}) => emails
  },
  SugarPage: {
    async documents(sugarPage) {
      return sugarPage.documents.sort(function(a,b) {
					var aDept = a.name;
					var bDept = b.name;
          if ( aDept < bDept )
						return 1;
					if ( aDept > bDept )
						return -1;
					return 0;
				});;
    },
    async lastDocLink(sugarPage) {
      let sessionId = await sugarLogin();
      let revisionId = sugarPage.documents[0].link;
      let docLink = await fetchFile(sessionId, revisionId);
      return {revisionId: revisionId, docLink: docLink};
    }
  },
  PrestaCatList: {
    async prestaCategory(category) {
      return await fetchPSCategory(category.id);
    }
  },
  PrestaCategory: {
    async products(category) {
      if(category){
        console.log("BEGIN: resolvers -> PrestaCategory: products", category.id);
        let products = [];
        if(category.associations && category.associations.products){
          let assocProducts = category.associations.products;
          for(let i=0; i<assocProducts.length; i++){
            products.push(await fetchPSProduct(assocProducts[i].id));
          }
        }
        console.log("END: resolvers -> PrestaCategory: products", category.id);
        return products;
      } else{
        console.log("WARN: resolvers -> PrestaCategory: products > Category is null");
      }
    }
  },
  Cart: {
    async products(cart) {
      return cart.fetchedProducts;
    }
  }
}

randomString = function(length) {
    var text = "";
    var possible = "0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

Meteor.methods({
  associateCategory(psCatId, wpPageId){
    console.log("BEGIN: associateCategory", psCatId, wpPageId);
    let currMap = Category.findOne({id: psCatId + ""});
    if(currMap)
      Category.update({id: psCatId}, {$set: {wpPageId: wpPageId}});
    else
      Category.insert({id: psCatId, wpPageId: wpPageId});
    console.log("END: associateCategory", psCatId, wpPageId);
    return true;
  },
  associateProduct(psProductId, wpMediaLink){
    console.log("BEGIN: associateProduct", psProductId, wpMediaLink);
    let currMap = Product.findOne({id: psProductId + ""});
    if(currMap)
      Product.update({id: psProductId}, {$set: {imageLink: wpMediaLink}});
    else
      Product.insert({id: psProductId, imageLink: wpMediaLink});
    console.log("END: associateProduct", psProductId, wpMediaLink);
    return true;
  },
  async createAccount(){
    let userId = this.userId;
    if(userId){
      let currUser = Meteor.users.findOne({_id: userId});
      if(currUser){
        let profile = currUser.profile;
        if(profile){
          if(!profile.suiteId){
            let sessionId = await sugarLogin();
            let suiteId = await createSuiteUser(currUser, sessionId);
            Meteor.users.update({_id: userId}, {$set: {"profile.suiteId": suiteId}});
          }
          else
            console.log("Suite User exists");
          if(!profile.prestaCustId){
            let prestaUser = await createPrestaUser(currUser.username);
            let prestaAddress = await createPrestaAddress(prestaUser.id, currUser.username);
            console.log(prestaAddress.id);
            Meteor.users.update({_id: userId}, {$set: {"profile.prestaCustId": prestaUser.id, "profile.prestaAddId": prestaAddress.id, "profile.prestaSecureKey": prestaUser.secure_key}});
          }
          else
            console.log("Presta User exists");
        } else{
          let sessionId = await sugarLogin();
          let suiteId = await createSuiteUser(currUser, sessionId);
          Meteor.users.update({_id: userId}, {$set: {"profile.suiteId": suiteId}});
          let prestaUser = await createPrestaUser(currUser.username);
          let prestaAddress = await createPrestaAddress(prestaUser.id, currUser.username);
          console.log(prestaAddress.id);
          Meteor.users.update({_id: userId}, {$set: {"profile.prestaCustId": prestaUser.id, "profile.prestaAddId": prestaAddress.id, "profile.prestaSecureKey": prestaUser.secure_key}});
        }
      } else{
        console.log("Meteor User not found");
      }
    }
    return "Association successful";
  },
  async fetchOrder(orderId){
    let userId = this.userId;
    if(userId){
      let order = await fetchPSOrder(orderId);
      let time = new Date().getTime();
      await OrderHistory.insert({orderId: orderId, user: userId, createAt: time});
      return order;
    }
  },
	async manageInvoice(orderId, documentName) {
    let userId = this.userId;
    if(userId){
      let currUser = Meteor.users.findOne({_id: userId});
      if(currUser && currUser.profile && currUser.profile.suiteId){
        let buffer = await processPSInvoice(orderId, currUser.profile.suiteId);
        if(buffer){
          let base64Bitmap = buffer.toString('base64');
          if(base64Bitmap){
            console.log("INFO: MOVING FILE TO SUGAR CRM AS ASYNC PROCESS");
            let sessionId = await sugarLogin();
            console.log("BEGIN: Create document in SuiteCRM");
            let documentId = await createDocument(documentName, sessionId);
            console.log("END: Create document in SuiteCRM", documentId);
            if(documentId){
              console.log("BEGIN: Create document revision in SuiteCRM");
              let docRevision = await setDocRevision(base64Bitmap, documentName, documentId, sessionId);
              console.log("END: Create document revision in SuiteCRM", docRevision);
              if(docRevision){
                console.log("BEGIN: Associate document to customer in SuiteCRM");
                let response = await docToAccount(documentId, currUser.profile.suiteId, sessionId);
                console.log("BEGIN: Associate document to customer in SuiteCRM", response);
                if(response){
                  console.log("BEGIN: Update repository in Meteor MongoDB");
                  OrderHistory.update({orderId: orderId}, {$set: {invoice: documentName, invoiceLink: docRevision}});
                  console.log("END: Update repository in Meteor MongoDB");
                  return docRevision;
                }
              }
            }
            // moveInvoiceToSugar(base64Bitmap, invoiceName, currUser.profile.suiteId, sessionId);
          } else{
            console.log("ERROR GENERATING BASE64 STRING");
          }
        } else{
          console.log("There was error with Order due to which Invoice could not be generated. Kindly check PrestaShop logs!");
        }
      } else{
        console.log("Suite User does not exist");
      }
    } else{
      console.log("Meteor User not found, please login to proceed");
    }
	},
  upsertCart(productId, attributeId, quantity, currCart) {
    console.log("Input: ", productId, attributeId, quantity);
    let userId = this.userId;
    if(userId){
      let currUser = Meteor.users.findOne({_id: userId});
      if(currUser && currUser.profile && currUser.profile.prestaAddId && currUser.profile.prestaCustId){
        let cartObj = prestaCartJson;
        let method;
        var cartRow = {};
        cartRow.id_product = productId;
        cartRow.id_product_attribute = attributeId;
        cartRow.id_address_delivery = "0";
        cartRow.quantity = quantity;
        if(currCart){
          cartObj = {};
          cartObj.prestashop = currCart;
          let cartRows = cartObj.prestashop.cart.associations.cart_rows;
          let newCartRows = [];
          let productAlreadyPresent = false;
          if(cartRows && cartRows.length>0){
            for(let i=0; i<cartRows.length; i++){
              if(cartRows[i].id_product == productId){
                productAlreadyPresent = true;
                cartRows[i].quantity = parseInt(cartRows[i].quantity) + parseInt(quantity);
              }
              newCartRows.push({cart_row: cartRows[i]});
            }
          }
          cartRows = newCartRows;
          if(!productAlreadyPresent){
            cartRows.push({cart_row: cartRow});
          }
          cartObj.prestashop.cart.associations.cart_rows = cartRows;
          method = "PUT";
        } else{
          var cartRows = [];
          cartRows.push({cart_row: cartRow});
          cartObj.prestashop.cart.associations.cart_rows = cartRows;
          method = "POST";
        }
        cartObj.prestashop.cart.id_address_delivery = currUser.profile.prestaAddId;
        cartObj.prestashop.cart.id_address_invoice = currUser.profile.prestaAddId;
        cartObj.prestashop.cart.id_customer = currUser.profile.prestaCustId;
        cartObj.prestashop.cart.secure_key = currUser.profile.prestaSecureKey;

        var xml = XML_START + jsonxml(cartObj);
        console.log(xml);
        let apiUrl = PRESTA_API_URL + "carts?output_format=JSON";
        let options = {
          method: method,
          uri: apiUrl,
          headers: {
              'authorization': PRESTA_KEY
          },
          body: xml
        };
        return rp(options)
          .then((res) => {
            currentCart = res;
            return res;
          });
      } else{
        console.log("Presta User does not exist");
      }
    } else{
      console.log("Meteor User not found, please login to proceed");
    }
  },
  async checkout(currCart) {
    let userId = this.userId;
    if(userId){
      let currUser = Meteor.users.findOne({_id: userId});
      if(currUser && currUser.profile && currUser.profile.prestaAddId && currUser.profile.prestaCustId){
        if(currCart){
          let finalOrderJson = prestaOrderJson;
          let orderObj = finalOrderJson.prestashop.order;
          orderObj.id_cart = currCart.id;
          let orderSubTotal = 0;
          let orderTotal = 0.00;

          let orderRows = [];
          let cartRows = currCart.associations.cart_rows;
          for(let i=0; i<cartRows.length; i++){
            let orderRow = {};
            orderRow.product_id = cartRows[i].id_product;
            orderRow.product_attribute_id = cartRows[i].id_product_attribute;
            orderRow.product_quantity = cartRows[i].quantity;
            orderRows.push({order_row: orderRow});

            let product = await fetchPSProduct(cartRows[i].id_product);
            console.log("Checkout: Product", product.price, cartRows[i].quantity);
            let productPrice = parseFloat(cartRows[i].quantity*product.actualPrice);
            orderSubTotal += productPrice;
          }
          console.log("Order SubTotal: ", orderSubTotal)
          orderTotal = orderSubTotal + 7.0;
          orderObj.id_address_delivery = currUser.profile.prestaAddId;
          orderObj.id_address_invoice = currUser.profile.prestaAddId;
          orderObj.id_customer = currUser.profile.prestaCustId;
          orderObj.secure_key = currUser.profile.prestaSecureKey;

          orderObj.total_products = orderSubTotal.toFixed(6);
          orderObj.total_products_wt = orderSubTotal.toFixed(6);
          orderObj.total_paid = orderTotal.toFixed(6);
          orderObj.total_paid_tax_incl = orderTotal.toFixed(6);
          orderObj.total_paid_tax_excl = orderTotal.toFixed(6);
          orderObj.total_paid_real = orderTotal.toFixed(6);

          finalOrderJson.prestashop.order = orderObj;

          var xml = XML_START + jsonxml(finalOrderJson);
          // console.log(xml);
          let apiUrl = PRESTA_API_URL + "orders?output_format=JSON";
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
              if(res){
                currentCart = null;
              }
              return res;
            });
        }
      } else{
        console.log("Presta User does not exist");
      }
    } else{
      console.log("Meteor User not found, please login to proceed");
    }
  }
});
