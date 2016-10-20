import { Meteor } from 'meteor/meteor';
import ReactDOM, { render } from 'react-dom';
import React from 'react';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { meteorClientConfig } from 'meteor/apollo';
import { ApolloProvider } from 'react-apollo';

import Layout from '/imports/ui/Layout';
import App from '/imports/ui/App';
import Wordpress from '/imports/ui/Wordpress';
import SugarCRM from '/imports/ui/SugarCRM';
import PrestaShop from '/imports/ui/PrestaShop';
import ExtGraphiQL from '/imports/ui/ExtGraphiQL';
import Admin from '/imports/ui/Admin';

const networkInterface = createNetworkInterface(window.location.origin + "/graphql");
const client = new ApolloClient(networkInterface);

Meteor.startup(() => {
	render(
		<ApolloProvider client={client}>
			<Router history={browserHistory}>
				<Route path="/" component={Layout}>
					<IndexRoute component={App} />
					<Route path="wordpressPage" component={Wordpress}/>
					<Route path="suitePage" component={SugarCRM}/>
					<Route path="suitePage/:id" component={SugarCRM}/>
					<Route path="prestaPage/:id" component={PrestaShop}/>
					<Route path="graphiql" component={ExtGraphiQL}/>
					<Route path="admin" component={Admin}/>
				</Route>
			</Router>
		</ApolloProvider>, document.getElementById('app')
	);
});
