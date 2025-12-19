import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';
export class Layout extends Component {
  static displayName = Layout.name;

    render() {
        window.addEventListener('load', () => {
            document.body.classList.add('loaded');
        });
    return (
      <div>
        <NavMenu />
        <Container className="AppContainer">
          {this.props.children}
        </Container>
      </div>
    );
  }
}
