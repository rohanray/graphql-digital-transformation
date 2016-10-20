import { Mongo } from 'meteor/mongo';
const Category = new Mongo.Collection('category');
const Product = new Mongo.Collection('product');
const OrderHistory = new Mongo.Collection('orderHistory');

export { Category, Product, OrderHistory }
