/*
	The primary component for the 2bored2wait web interface
	Copyright (C) 2021 Scott Maday
	
	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	
	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.
	
	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import React, { Component } from 'react';

import Header from './header';
import Frontend2Bored2Wait from './2bored2wait';

export default class App extends Component {
	render() {
		return (<React.Fragment>
			<Header/>
			<main>
				<Frontend2Bored2Wait refreshInterval="1000"/>
			</main>
		</React.Fragment>)
	}
}
