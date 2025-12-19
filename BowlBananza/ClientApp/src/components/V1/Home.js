import React, { Component } from 'react';

export class Home extends Component {
  static displayName = Home.name;

    render() {
      return (
        <div className="HomeLogoHolder">
            <div className="HomeLogoBG"></div>
            <div className="loading"></div>
            <div className='HomeLogo'></div>
        </div>

    );
  }
}
