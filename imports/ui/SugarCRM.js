import React, { Component } from 'react';
import { connect } from 'react-apollo';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import gql from 'graphql-tag';
import { Button, Panel, ListGroup, ListGroupItem, Well, Row, Col, Nav, Alert } from 'react-bootstrap';
import { Link } from 'react-router';

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

const SugarCRM = ({currentSugar, currentDocument}) => {
  if(location.pathname != "/suitePage" && currentSugar && !currentSugar.loading){
    let sugarPage = currentSugar.sugarPage;
    if(sugarPage && sugarPage.length>0){
      let documents = sugarPage[0].documents;
      if(documents){
        let refetchRequired = true;
        for(let i=0; i<documents.length; i++){
          if(location.pathname.indexOf(documents[i].link) > -1){
            refetchRequired = false
            break;
          }
        }
        if(refetchRequired){
          currentSugar.refetch();
        }
      }
    }
  }
	return (
		<div>
			<Well bsSize="small">
				<h1>
          Suite CRM Invoices&nbsp;
          { currentSugar ? (
  		      <Button bsStyle="primary" bsSize="small" id="suiteRefetchBtn" onClick={() => currentSugar.refetch()} type="button" class="btn btn-primary">Refetch!</Button>
          ) : '' }
        </h1>
			</Well>
        { !currentSugar ? (
         <Alert bsStyle="danger">
           Kindly login to view yor Suite CRM related data!
         </Alert>
        ) : currentSugar.sugarPage ? (
				<div>
					{currentSugar.sugarPage.map(account => {
						return (
							<Panel header={"Suite CRM Reference: " + account.id} bsStyle="primary" key={account.id}>
								<ListGroup>
									<ListGroupItem bsStyle="info"><strong>Name: </strong>{account.name}</ListGroupItem>
									<ListGroupItem bsStyle="info"><strong>Documents</strong></ListGroupItem>
									<ListGroupItem>
										<Row className="clearfix">
											<Col sm={3}>
												<Nav bsStyle="pills" stacked>
													{account.documents.map(document => {
															return (
																<NavbarLink
                                  key={document.name}
										              title={document.name}
										              href={"/suitePage/" + document.link}
																	active={(location.pathname === "/suitePage/" + document.link) || (location.pathname === "/suitePage" && account.lastDocLink && account.lastDocLink.revisionId == document.link)}
																/>
															)
														})
													}
												</Nav>
								      </Col>
								      <Col sm={9}>
												{currentDocument.documentLink ? (
													<embed style={{height: '582px', width:'100%'}} type="application/pdf" src={"data:application/pdf;base64," + currentDocument.documentLink}></embed>
												) : (location.pathname === "/suitePage" && account.lastDocLink) ? (
													<embed style={{height: '582px', width:'100%'}} type="application/pdf" src={"data:application/pdf;base64," + account.lastDocLink.docLink}></embed>
												) : (location.pathname != "/suitePage") ? (
                          <div style={{padding: "10px"}}>
                  					<Alert bsStyle="warning">
                              <div className="alert-with-loader">
                                Loading Invoice PDF, please wait!
                              </div>
                              <div className="spinner-container"><div className="spinner"></div></div>
                  					</Alert>
                  				</div>
												) : (
                          <div style={{padding: "10px"}}>
                  					<Alert bsStyle="warning">
                              No Orders placed yet! No PDF to display!
                  					</Alert>
                  				</div>
                        )}
											</Col>
										</Row>
									</ListGroupItem>
								</ListGroup>
							</Panel>
						);
					}
					)}
				</div>
			) : currentSugar.loading ? (
        <Alert bsStyle="warning">
          <div className="alert-with-loader">
            Loading Invoices, please wait!
          </div>
          <div className="spinner-container"><div className="spinner"></div></div>
        </Alert>
      ) : (
        <Alert bsStyle="danger">
          No Orders placed yet! No Invoices to show!
        </Alert>
      ) }
		</div>
	)
}

// This container brings in Apollo GraphQL data
const SugarCRMData = connect({
  mapQueriesToProps({ ownProps }) {
		let sessionVar = Session.get("myVar");
		console.log(sessionVar);
    if (ownProps.userId) {
      return {
    		currentSugar: {
          query: gql`
            query getSugarData ($id: String!) {
              sugarPage(id: $id) {
                id
								name
								documents {
									id
									name
                  activeDate
									link
								}
                lastDocLink {
                  revisionId
                  docLink
                }
              }
            }
          `,
          variables: {
            id: ownProps.userId,
          },
        },
				currentDocument: {
          query: gql`
            query getDocLink ($id: String!) {
              documentLink(id: $id)
            }
          `,
          variables: {
            id: ownProps.documentId
          },
        }
      };
    }
  },
})(SugarCRM);

// This container brings in Tracker-enabled Meteor data
const SugarContainer = createContainer(({params}) => {
	if(params.id){
		return {
			userId: Meteor.userId(),
			documentId: params.id
		}
	} else{
		return {
			userId: Meteor.userId(),
			documentId: ""
		}
	}
}, SugarCRMData);

export default SugarContainer;
