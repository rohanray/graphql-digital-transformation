import React, { Component } from 'react';
import { connect } from 'react-apollo';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { createContainer } from 'meteor/react-meteor-data';
import gql from 'graphql-tag';
import { Button, ListGroup, ListGroupItem, Jumbotron, PageHeader, ButtonToolbar, Alert } from 'react-bootstrap';

function createAccount() {
	Meteor.call("createAccount", function(err, res){
    // console.log("URL: ", res, err);
		if(res){
			$("#refetchAccount").click();
		}
  });
}

const App = ({ userId, currentUser, currentSugar }) => {
  return (
		<Jumbotron>
      <PageHeader>
        Welcome to KaTaNa Stack!
      </PageHeader>
		  { (userId && currentUser.user) ? (
        <div>
          <ListGroup>
            <ListGroupItem>Meteor Username: {currentUser.user.username}</ListGroupItem>
            <ListGroupItem>PrestaShop Reference: {currentUser.user.prestaId}</ListGroupItem>
            <ListGroupItem>SuiteCRM Reference: {currentUser.user.suiteId}</ListGroupItem>
          </ListGroup>
          { (!currentUser.user.prestaId || !currentUser.user.suiteId) ? (
            <ButtonToolbar>
            <Button bsStyle="primary" onClick={() => createAccount()}>Associate with PrestaShop and SuiteCRM</Button>
            <Button bsStyle="primary" id="refetchAccount" onClick={() => currentUser.refetch()}>Refetch!</Button>
            </ButtonToolbar>
          ): (
            <ButtonToolbar>
            <Button bsStyle="primary" id="refetchAccount" onClick={() => currentUser.refetch()}>Refetch!</Button>
            </ButtonToolbar>
          )}
        </div>
		  ) : currentUser && currentUser.loading ? (
				<Alert bsStyle="warning">
					<div className="alert-with-loader">
						Loading User Details, please wait!
					</div>
					<div className="spinner-container"><div className="spinner"></div></div>
				</Alert>
			) : (
				<p>Please log in!</p>
			) }
		</Jumbotron>
  )
}

// This container brings in Apollo GraphQL data
const AppWithData = connect({
  mapQueriesToProps({ ownProps }) {
    if (ownProps.userId) {
      return {
        currentUser: {
          query: gql`
            query getUserData ($id: String!) {
              user(id: $id) {
                emails {
                  address
                  verified
                }
                username
                prestaId
                suiteId
              }
            }
          `,
          variables: {
            id: ownProps.userId,
          },
        },
      };
    }
  },
})(App);

// This container brings in Tracker-enabled Meteor data
const AppWithUserId = createContainer(() => {
  return {
    userId: Meteor.userId(),
  };
}, AppWithData);

export default AppWithUserId;
