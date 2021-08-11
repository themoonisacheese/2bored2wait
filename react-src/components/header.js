import React, { Component } from 'react';
import { Nav, Navbar, Container } from 'react-bootstrap'

import Logo from '../../images/logo.png'

export default class Header extends Component {
	render() {
		return (<header>
			<Navbar bg="dark" variant="dark">
				<Container>
					<Navbar.Brand href="index.html">
						<img src={Logo} width="30" height="30" className="d-inline-block align-top" /> 2bored2wait
					</Navbar.Brand>
				</Container>
			</Navbar>
		</header>)
	}
}

