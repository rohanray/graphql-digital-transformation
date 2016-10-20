import React, { Component } from 'react';
import { connect } from 'react-apollo';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import { Link } from 'react-router';
import { Session } from 'meteor/session';
import gql from 'graphql-tag';
import { ButtonToolbar, Button, Well, Grid, Row, Col, Panel, Table, Tab, Nav, NavItem, Alert } from 'react-bootstrap';

function addToCart(productId, attributeId, categoryId) {
	console.log(productId, attributeId, categoryId);
	if(Meteor.userId()){
		var quantity = $("#quantity_"+ categoryId + "_" + productId).val();
		if(quantity > 0){
			Meteor.call("upsertCart", productId, attributeId, quantity, Session.get("currCart"), function(err, res){
				if(res){
					let jsonRes = JSON.parse(res);
					Session.set("currCart", jsonRes);
					$("#refetchBtn").click();
				} else{
					console.log("ERR: ", err);
				}
			});
		} else{
			console.log("No Quantity entered");
		}
	} else {
		alert("Please login to continue!");
	}
}

function getInvoiceName(invoiceId){
	return ["#IN", addZero(invoiceId.length), invoiceId, ".pdf"].join("");
}

function addZero(noOfZeros){
	let zeroStr = "";
	for(let i=0; i<6-noOfZeros; i++){
		zeroStr += 0;
	}
	return zeroStr;
}

function checkout(){
	let currCart = Session.get("currCart");
	if(currCart){
		Meteor.call("checkout", currCart.cart, function(err, res){
			if(res){
				let jsonRes = JSON.parse(res);
				Meteor.call("fetchOrder", jsonRes.order.id, function(err, res){
					if(res){
						if(res.invoice_number != "0"){
							let invoiceName = getInvoiceName(res.invoice_number);
							Meteor.call("manageInvoice", res.id, invoiceName, Meteor.userId(), function(err, res){
								$("#refetchBtn").click();
							});
						} else {
							console.log("fetchOrder: Invoice cannot be generated. Please check the logs/order in PrestaShop!");
						}
						Session.set("currCart");
						$("#refetchBtn").click();
					} else{
						console.log("fetchOrder: ERROR: ", err);
					}
				});
			} else{
				console.log("checkout: ERROR: ", err);
			}
		});
	} else{
		console.log("Nothing in cart yet!");
	}
}

function NavbarLink({ title, href, active = false }) {
  return (
    <li className={active && 'active'}>
      <Link to={href}>
        {title}
        {active && (
          <span className="sr-only">
            (current)
          </span>
        )}
      </Link>
    </li>
  );
}

NavbarLink.propTypes = {
  title: React.PropTypes.string,
  href: React.PropTypes.string,
  active: React.PropTypes.bool,
};

const PrestaShop = ({currPSCart, catList, prodList}) => {
	return (
		<div>
			<Well bsSize="small">
				<h1>
					PrestaShop Catalog&nbsp;
					<Button bsStyle="primary" bsSize="small" id="refetchBtn" onClick={() => currPSCart.refetch()}>Refetch!</Button>
				</h1>
			</Well>
			{ currPSCart.lastOrder ? (
				<div style={{paddingTop: "10px"}}>
					{currPSCart.lastOrder.invoiceLink ? (
						<Alert bsStyle="success">
							Your last order: <strong>#{currPSCart.lastOrder.orderId}</strong> with invoice&nbsp;
							<strong>
								<Link to={"/suitePage/" + currPSCart.lastOrder.invoiceLink}>
									{currPSCart.lastOrder.invoice}
								</Link>
							</strong>
						</Alert>
					) : (
						<Alert bsStyle="info">
							<div className="alert-with-loader">
								Your order: <strong>#{currPSCart.lastOrder.orderId}</strong> is being processed! Please wait!
							</div>
							<div className="spinner-container"><div className="spinner"></div></div>
						</Alert>
					)}
				</div>
			) : ''}
			{ currPSCart.currentCart ? (
				<div style={{paddingTop: "10px", paddingBottom: "10px"}}>
					<Table striped bordered condensed hover>
						<thead>
							<tr>
								<th colSpan={4} style={{textAlign: 'left'}}><strong>{currPSCart.currentCart.id}: Current Cart</strong> ({currPSCart.currentCart.totalItems} items)</th>
							</tr>
							<tr>
								<th style={{textAlign: 'left', width: "25%"}}>Name</th>
								<th style={{textAlign: 'center', width: "25%"}}>Price</th>
								<th style={{textAlign: 'center', width: "25%"}}>Quantity</th>
								<th style={{textAlign: 'right', width: "25%"}}>Total Price</th>
							</tr>
						</thead>
						<tbody>
							{currPSCart.currentCart.products.map(product => {
									return (
										<tr key={product.id}>
											<td style={{textAlign: 'left', width: "25%"}}>{product.name + " (" + product.reference + ")"}</td>
											<td style={{textAlign: 'center', width: "25%"}}>${product.price}</td>
											<td style={{textAlign: 'center', width: "25%"}}>{product.quantity}</td>
											<td style={{textAlign: 'right', width: "25%"}}>${product.totalPrice}</td>
										</tr>
									)
								}
							)}
							<tr>
								<th colSpan={4} style={{textAlign: 'right'}}>Total Price: ${currPSCart.currentCart.totalPrice}</th>
							</tr>
						</tbody>
					</Table>
					<Button bsStyle="primary" bsSize="small" id="checkoutBtn" onClick={() => checkout()}>Place Order</Button>
				</div>
			) : (
				<div style={{paddingTop: "10px"}}>
					<Alert bsStyle="warning">
						<strong>Your cart is empty!</strong> Please add an item to proceed!
					</Alert>
				</div>
			)}
			{ catList.categoryList ? (
		    <Row className="clearfix">
		      <Col sm={3}>
		        <Nav bsStyle="pills" stacked>
							{catList.categoryList.map(category => {
								return (
									<NavbarLink
										key={category.id}
			              title={category.name}
			              href={"/prestaPage/" + category.id}
										active={location.pathname === "/prestaPage/" + category.id}
									/>
								)}
							)}
		        </Nav>
		      </Col>
		      <Col sm={9}>
						{prodList.currCategory ? (
							<div dangerouslySetInnerHTML={{__html: prodList.currCategory.description}} />
						) : '' }
						<Grid style={{width: '100%'}}>
							{ prodList.productList ? (
								<Row className="show-grid">
									{prodList.productList.map(product => {
										return (
											<Col xs={6} md={4} key={product.id}>
												<Panel header={product.name + "\n(" + product.reference + ")"} bsStyle="success">
													<p><strong>Brand: {product.manufacturer_name}</strong></p>
													<p><img src={product.imageLink} style={{maxWidth: "100%"}}/></p>
													<p>Price: ${product.price}</p>
													<input type="number" id={"quantity_"+ product.categoryId + "_" + product.id}/>
													<Button style={{marginTop: "10px"}} bsStyle="primary" bsSize="small" onClick={() => addToCart(product.id, product.attributeId, product.categoryId)}>Add to Cart</Button>
												</Panel>
											</Col>
										)
									}
									)}
								</Row>
							) : prodList.loading ? (
								<Alert bsStyle="warning">
									<div className="alert-with-loader">
										Loading Products, please wait!
									</div>
									<div className="spinner-container"><div className="spinner"></div></div>
								</Alert>
							) : '' }
						</Grid>
		      </Col>
		    </Row>
			) : catList.loading ? (
				<Alert bsStyle="warning">
					<div className="alert-with-loader">
						Loading Categories, please wait!
					</div>
					<div className="spinner-container"><div className="spinner"></div></div>
				</Alert>
			) : '' }
		</div>
	)
}

// This container brings in Apollo GraphQL data
const PrestaShopData = connect({
  mapQueriesToProps({ ownProps }) {
    return {
			catList: {
				query: gql`
          query getCatList ($id: String!) {
            categoryList(id: $id) {
							id
							name
							description
            },
          }
        `,
        variables: {
          id: "Category",
        },
			},
			prodList: {
				query: gql`
          query getProdList ($id: String!) {
						currCategory(id: $id){
							id
							name
							description
						},
            productList(id: $id) {
							id
							name
							reference
							manufacturer_name
						  price
						  wholesale_price
						  attributeId
						  quantity
						  totalPrice
							categoryId
							imageLink
            },
          }
        `,
        variables: {
          id: ownProps.categoryId,
        },
			},
			currPSCart: {
        query: gql`
          query getPSCart ($id: String!, $userId: String!) {
            currentCart(id: $id){
							id
							products {
								id
								name
								reference
								price
								quantity
								totalPrice
							}
							totalPrice
							totalItems
						},
						lastOrder(id: $userId){
							orderId
							invoice
							invoiceLink
						}
          }
        `,
        variables: {
          id: "Category",
					userId: ownProps.userId
        },
      }
    };
  },
})(PrestaShop);

// This container brings in Tracker-enabled Meteor data
const PrestaShopContainer = createContainer(({params}) => {
	let userId = Meteor.userId();
  return {
    userId: userId ? userId : "",
		categoryId: params.id
  };
}, PrestaShopData);

export default PrestaShopContainer;
