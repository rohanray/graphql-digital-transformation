import React, { Component } from 'react';
import { connect } from 'react-apollo';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import gql from 'graphql-tag';
import { Button, Panel, Alert, Well } from 'react-bootstrap';
import { Link } from 'react-router';

const Wordpress = ({currentWP}) => {
	return (
		<div>
			<Well bsSize="small">
				<h1>
					Wordpress Static Content&nbsp;
					<Button bsStyle="primary" bsSize="small" onClick={() => currentWP.refetch()} type="button" class="btn btn-primary">Refetch!</Button>
				</h1>
			</Well>
			{ currentWP.wordpressPage ? (
				<div style={{paddingTop: "10px"}}>
					{currentWP.wordpressPage.map(feature => {
						return (
							<Panel header={feature.slug} bsStyle="info" key={feature.slug}>
								<Link to={"/prestaPage/" + feature.prestaCatId}>
									<div dangerouslySetInnerHTML={{__html: feature.content}} />
								</Link>
							</Panel>
						);
					}
					)}
				</div>
			) : currentWP.loading ? (
				<Alert bsStyle="warning">
					<div className="alert-with-loader">
						Loading Category Pages, please wait!
					</div>
					<div className="spinner-container"><div className="spinner"></div></div>
				</Alert>
			) : '' }
		</div>
	)
}

// This container brings in Apollo GraphQL data
const WordpressData = connect({
  mapQueriesToProps({ ownProps }) {
    return {
			currentWP: {
        query: gql`
          query getWPData ($id: String!) {
            wordpressPage(id: $id) {
              slug
							comment_status
							content
							prestaCatId
            }
          }
        `,
        variables: {
          id: "2",
        },
      }
    };
  },
})(Wordpress);

// This container brings in Tracker-enabled Meteor data
const WordpressContainer = createContainer(() => {
  return {
    userId: Meteor.userId(),
  };
}, WordpressData);

export default WordpressContainer;
