import React from 'react';
import { graphql } from 'react-apollo';
import { Link } from 'react-router';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import gql from 'graphql-tag';

import AccountsUIWrapper from './AccountsUIWrapper.js';

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY'
});

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

function Layout({ currUser, children, params, location }) {
  return (
    <div>
      <nav className="navbar navbar-default">
        <div className="container">
          <ul className="nav navbar-nav">
            <NavbarLink
              title="Home"
              href="/"
              active={location.pathname === '/'}
            />
            <NavbarLink
              title="Wordpress"
              href="/wordpressPage"
              active={location.pathname === '/wordpressPage'}
            />
            <NavbarLink
              title="Suite CRM"
              href="/suitePage"
              active={location.pathname.indexOf('suitePage') > -1}
            />
            <NavbarLink
              title="PrestaShop"
              href="/prestaPage/8"
              active={location.pathname.indexOf('prestaPage') > -1}
            />
            <NavbarLink
              title="GraphiQL"
              href="/graphiql"
              active={location.pathname === "/graphiql"}
            />
            {(currUser && currUser.username === "admin") ? (
              <NavbarLink
                title="Admin"
                href="/admin"
                active={location.pathname === "/admin"}
              />
            ) : ""}
          </ul>
          <div style={{float: "right", paddingTop: "10px"}}><AccountsUIWrapper /></div>
        </div>
      </nav>
      <div className="container">
        {children}
      </div>
    </div>
  );
}

Layout.propTypes = {
  location: React.PropTypes.object,
  params: React.PropTypes.object,
  children: React.PropTypes.element,
};

export default createContainer(({ children, params, location }) => ({
  currUser: Meteor.user(),
  children: children,
  params: params,
  location: location
}), Layout);
