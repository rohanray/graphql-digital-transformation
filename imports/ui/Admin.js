import React, { Component } from 'react';
import { connect } from 'react-apollo';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { createContainer } from 'meteor/react-meteor-data';
import gql from 'graphql-tag';
import { Well, Button, ListGroup, ListGroupItem, Table, PageHeader, ButtonToolbar, Alert, Row, Col } from 'react-bootstrap';

function editCategory(categoryId){
	$(".category.edit_"+categoryId).hide();
	$(".category.associate_"+categoryId).show();
	$(".category.cancelEdit_"+categoryId).show();
	$(".catSpan_"+categoryId).hide();
	$(".catSpanTxt_"+categoryId).show();
}

function cancelEditCategory(categoryId){
	$(".category.edit_"+categoryId).show();
	$(".category.associate_"+categoryId).hide();
	$(".category.cancelEdit_"+categoryId).hide();
	$(".catSpan_"+categoryId).show();
	$(".catSpanTxt_"+categoryId).hide();
}

function associateCategory(categoryId) {
	let wpPageId = $("#wpPageId_"+categoryId).val();
	Meteor.call("associateCategory", categoryId, wpPageId, function(err, res){
		if(res){
			$("#refetchBtn").click();
			$(".category.edit_"+categoryId).show();
			$(".category.associate_"+categoryId).hide();
			$(".category.cancelEdit_"+categoryId).hide();
			$(".catSpan_"+categoryId).show();
			$(".catSpanTxt_"+categoryId).hide();
		}
  });
}

function editProduct(productId){
	$(".product.edit_"+productId).hide();
	$(".product.associate_"+productId).show();
	$(".product.cancelEdit_"+productId).show();
	$(".productSpan_"+productId).hide();
	$(".productSpanTxt_"+productId).show();
}

function cancelEditProduct(productId){
	$(".product.edit_"+productId).show();
	$(".product.associate_"+productId).hide();
	$(".product.cancelEdit_"+productId).hide();
	$(".productSpan_"+productId).show();
	$(".productSpanTxt_"+productId).hide();
}

function associateProduct(productId) {
	let wpMediaLink = $("#wpMediaLink_"+productId).val();
	Meteor.call("associateProduct", productId, wpMediaLink, function(err, res){
		if(res){
			$("#refetchBtn").click();
			$(".product.edit_"+productId).show();
			$(".product.associate_"+productId).hide();
			$(".product.cancelEdit_"+productId).hide();
			$(".productSpan_"+productId).show();
			$(".productSpanTxt_"+productId).hide();
		}
  });
}

const Admin = ({ currUser, currMap }) => {
  return (
		<div>
			<Well bsSize="small">
	      <h1>
	        PrestaShop-Wordpress Mapping!&nbsp;
					{(currMap) ? (
						<Button bsStyle="primary" bsSize="small" id="refetchBtn" onClick={() => currMap.refetch()}>Refetch!</Button>
					) : ""}
	      </h1>
			</Well>
		  { (currUser && currMap) ? (
        <div>
          {(currMap.categoryMap) ? (
						<div>
							<h2>Category Mapping</h2>
							<Table striped bordered condensed hover>
								<thead>
									<tr>
										<th colSpan={4} style={{textAlign: 'left', width: "40%"}}>PrestaShop Category</th>
										<th colSpan={4} style={{textAlign: 'left', width: "40%"}}>Wordpress Page ID</th>
										<th colSpan={4} style={{textAlign: 'center', width: "20%"}}>Actions</th>
									</tr>
								</thead>
								<tbody>
								{currMap.categoryMap.map(category => {
									return (
										<tr key={category.id}>
											<td colSpan={4} style={{textAlign: 'left', width: "40%"}}>{category.name}</td>
											<td colSpan={4} style={{textAlign: 'left', width: "40%"}}>
												<span className={"catSpan_"+category.id}>{category.value}</span>
												<span className={"catSpanTxt_"+category.id} style={{display:"none"}}>
													<input type="text" id={"wpPageId_"+category.id} defaultValue={(category.value) ? category.value : ""}/>
												</span>
											</td>
											<td colSpan={4} style={{textAlign: 'center', width: "20%"}}>
												<ButtonToolbar>
													<Button bsStyle="primary" className={"category edit_"+category.id} onClick={() => editCategory(category.id)}>Edit</Button>
													<Button bsStyle="primary" style={{display:"none"}} className={"category associate_"+category.id} onClick={() => associateCategory(category.id)}>Save</Button>
													<Button bsStyle="primary" style={{display:"none"}} className={"category cancelEdit_"+category.id} onClick={() => cancelEditCategory(category.id)}>Cancel</Button>
												</ButtonToolbar>
											</td>
										</tr>
									)
								})}
								</tbody>
							</Table>
						</div>
					) : ""}
					{(currMap.productMap) ? (
						<div>
							<h2>Product Mapping</h2>
							<Table striped bordered condensed hover>
								<thead>
									<tr>
										<th colSpan={4} style={{textAlign: 'left', width: "30%"}}>PrestaShop Product</th>
										<th colSpan={4} style={{textAlign: 'left', width: "50%"}}>Wordpress Image Link</th>
										<th colSpan={4} style={{textAlign: 'center', width: "20%"}}>Actions</th>
									</tr>
								</thead>
								<tbody>
									{currMap.productMap.map(product => {
										return (
											<tr key={product.id}>
												<td colSpan={4} style={{textAlign: 'left', width: "30%"}}>{product.name}</td>
												<td colSpan={4} style={{textAlign: 'left', width: "50%"}}>
													<span className={"productSpan_"+product.id}>{product.value}</span>
													<span className={"productSpanTxt_"+product.id} style={{display:"none"}}>
														<input type="text" style={{width: "100%"}} id={"wpMediaLink_"+product.id} defaultValue={(product.value) ? product.value : ""}/>
													</span>
												</td>
												<td colSpan={4} style={{textAlign: 'center', width: "20%"}}>
													<ButtonToolbar>
														<Button bsStyle="primary" className={"product edit_"+product.id} onClick={() => editProduct(product.id)}>Edit</Button>
														<Button bsStyle="primary" style={{display:"none"}} className={"product associate_"+product.id} onClick={() => associateProduct(product.id)}>Save</Button>
														<Button bsStyle="primary" style={{display:"none"}} className={"product cancelEdit_"+product.id} onClick={() => cancelEditProduct(product.id)}>Cancel</Button>
													</ButtonToolbar>
												</td>
											</tr>
										)
									})}
								</tbody>
							</Table>
						</div>
					) : currMap.loading ? (
						<Alert bsStyle="warning">
							<div className="alert-with-loader">
								Loading Mapping Details, please wait!
							</div>
							<div className="spinner-container"><div className="spinner"></div></div>
						</Alert>
					): ""}
        </div>
		  ) : (currUser && !currUser.loading && currUser.username != "admin") ? (
				<p>Unauthorized access!</p>
			) : (
				<p>Please log in!</p>
			) }
		</div>
  )
}

// This container brings in Apollo GraphQL data
const AdminWithData = connect({
  mapQueriesToProps({ ownProps }) {
    if (ownProps.currUser && ownProps.currUser.username === "admin") {
      return {
        currMap: {
          query: gql`
            query getMapData ($id: String!) {
              categoryMap(id: $id) {
                id
								name
								value
              },
							productMap(id: $id) {
                id
								name
								value
              }
            }
          `,
          variables: {
            id: "Dummy",
          },
        },
      };
    }
  },
})(Admin);

// This container brings in Tracker-enabled Meteor data
const AdminWithUserId = createContainer(() => {
  return {
    currUser: Meteor.user(),
  };
}, AdminWithData);

export default AdminWithUserId;
