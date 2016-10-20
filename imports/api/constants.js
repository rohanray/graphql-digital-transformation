const WP_API_URL = Meteor.settings["WP_API_URL"];
const WP_NO_IMAGE_LINK = Meteor.settings["WP_NO_IMAGE_LINK"];
const SUGAR_API_URL = Meteor.settings["SUGAR_API_URL"];
const SUGAR_USERNAME = Meteor.settings["SUGAR_USERNAME"];
const SUGAR_PASSWORD = Meteor.settings["SUGAR_PASSWORD"];
const PRESTA_API_URL = Meteor.settings["PRESTA_API_URL"];
const PRESTA_KEY = Meteor.settings["PRESTA_KEY"];
const PRESTA_PDF_LINK = Meteor.settings["PRESTA_PDF_LINK"];

const XML_START = '<?xml version="1.0" encoding="UTF-8" ?>';

const prestaCartJson = {
  prestashop: {
    cart: {
      id: "",
      id_address_delivery: "",
      id_address_invoice: "",
      id_currency: "1",
      id_customer: "",
      id_guest: "",
      id_lang: "1",
      id_shop_group: "1",
      id_shop: "1",
      id_carrier: "2",
      recyclable: "",
      gift: "",
      gift_message: "",
      mobile_theme: "",
      delivery_option: "",
      secure_key: "",
      allow_seperated_package: "",
      date_add: "",
      date_upd: "",
      associations: {
         cart_rows: []
       },
    }
  }
};

const prestaOrderJson = {
  prestashop: {
  	"order" : {
  		"id" : "",
  		"id_address_delivery" : "",
  		"id_address_invoice" : "",
  		"id_cart" : "",
  		"id_currency" : "1",
  		"id_lang" : "1",
  		"id_customer" : "",
  		"id_carrier" : "2",
  		"current_state" : "3",
  		"module" : "cashondelivery",
  		"invoice_number" : "",
  		"invoice_date" : "",
  		"delivery_number" : "",
  		"delivery_date" : "",
  		"valid" : "0",
  		"date_add" : "",
  		"date_upd" : "",
  		"shipping_number" : "",
  		"id_shop_group" : "1",
  		"id_shop" : "1",
  		"secure_key" : "",
  		"payment" : "Cash on delivery (COD)",
  		"recyclable" : "0",
  		"gift" : "0",
  		"gift_message" : "",
  		"mobile_theme" : "0",
  		"total_discounts" : "0.000000",
  		"total_discounts_tax_incl" : "0.000000",
  		"total_discounts_tax_excl" : "0.000000",
  		"total_paid" : "",
  		"total_paid_tax_incl" : "",
  		"total_paid_tax_excl" : "",
  		"total_paid_real" : "",
  		"total_products" : "",
  		"total_products_wt" : "",
  		"total_shipping" : "0.000000",
  		"total_shipping_tax_incl" : "0.000000",
  		"total_shipping_tax_excl" : "0.000000",
  		"carrier_tax_rate" : "0.000",
  		"total_wrapping" : "0.000000",
  		"total_wrapping_tax_incl" : "0.000000",
  		"total_wrapping_tax_excl" : "0.000000",
  		"round_mode" : "",
  		"round_type" : "",
  		"conversion_rate" : "1",
  		"reference" : "",
  		"associations" : {
   			"order_rows" : []
   		}
  	}
  }
}

const prestaCustomerJson = {
  prestashop: {
  	"customer" : {
  		"id" : "",
  		"id_default_group" : "3",
  		"id_lang" : "1",
  		"newsletter_date_add" : "",
  		"ip_registration_newsletter" : "",
  		"last_passwd_gen" : "",
  		"secure_key" : "",
  		"deleted" : "0",
  		"passwd" : "",
  		"lastname" : "",
  		"firstname" : "",
  		"email" : "",
  		"id_gender" : "",
  		"birthday" : "",
  		"newsletter" : "0",
  		"optin" : "0",
  		"website" : "",
  		"company" : "",
  		"siret" : "",
  		"ape" : "",
  		"outstanding_allow_amount" : "0.000000",
  		"show_public_prices" : "0",
  		"id_risk" : "0",
  		"max_payment_days" : "0",
  		"active" : "1",
  		"note" : "",
  		"is_guest" : "0",
  		"id_shop" : "1",
  		"id_shop_group" : "1",
  		"date_add" : "",
  		"date_upd" : "",
  		"associations" : ""
  	}
  }
}

const prestaAddressJson = {
  prestashop: {
  	"address" : {
  		"id" : "",
  		"id_customer" : "",
  		"id_manufacturer" : "1",
  		"id_supplier" : "0",
  		"id_warehouse" : "0",
  		"id_country" : "21",
  		"id_state" : "32",
  		"alias" : "manufacturer",
  		"company" : "Fashion",
  		"lastname" : "",
  		"firstname" : "",
  		"vat_number" : "",
  		"address1" : "767 Fifth Ave.",
  		"address2" : "",
  		"postcode" : "10154",
  		"city" : "New York",
  		"other" : "",
  		"phone" : "",
  		"phone_mobile" : "",
  		"dni" : "",
  		"deleted" : "0",
  		"date_add" : "",
  		"date_upd" : "",
  	}
  }
}

export { WP_API_URL, WP_NO_IMAGE_LINK, SUGAR_API_URL, SUGAR_USERNAME, SUGAR_PASSWORD, PRESTA_API_URL, PRESTA_KEY, XML_START, PRESTA_PDF_LINK, COOKIE_VALUE, prestaCartJson,prestaOrderJson ,prestaCustomerJson , prestaAddressJson };
