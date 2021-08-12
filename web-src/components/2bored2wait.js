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
import {Container, Alert, Spinner, Button, FormGroup, FormControl, FloatingLabel, FormCheck, Row, Col} from 'react-bootstrap'

export default class Frontend2Bored2Wait extends Component {
	static defaultState = {
		feedback: {
			ETA: "None",
			queuePlace : "None",
			isInQueue: false,
			restartQueue: false,
			password: ""
		},
		feedbackStatus: undefined,
		password: "",
	};
	
	constructor(props) {
		super(props);
		this.state = Frontend2Bored2Wait.defaultState;
	}
	
	componentDidMount() {
		this.interval = setInterval(this.update.bind(this), this.props.refreshInterval)
		this.update();
	}
	
	update() {
		fetch("update", { headers: { "XPassword" : this.state.password } }).then(res => res.ok
			? res.json().then(feedback => this.setState({ feedback: feedback, feedbackStatus: res.ok })) // create a new promise
			: this.setState({ feedback: Frontend2Bored2Wait.defaultState.feedback, feedbackStatus: res.status }) // set state now in failure
		);
	}
	
	start() {
		fetch("start", { headers: { "XPassword" : this.state.password } }).then(res => res.ok).then(success => this.setState({ feedback: { ...this.state.feedback, isInQueue: success } })); // preemptively change state
	}
	
	stop() {
		fetch("stop", { headers: { "XPassword" : this.state.password } }).then(res => res.ok).then(success => this.setState({ feedback: { ...this.state.feedback, isInQueue: !success } }));
	}
	
	toggleRestartQueue() {
		fetch("togglerestart", { headers: { "XPassword" : this.state.password } }).then(res => res.ok).then(success => this.setState({ feedback: { ...this.state.feedback, restartQueue: !this.state.feedback.isInQueue } }));
	}
	
	render() {
		const {ETA, queuePlace, isInQueue, restartQueue} = this.state.feedback;
		const {feedbackStatus} = this.state;
		let feedbackComponent = <React.Fragment/>
		if (feedbackStatus === undefined) {
			feedbackComponent = <Spinner animation="border" />
		} else if (feedbackStatus == 403) {
			feedbackComponent = <Alert variant="danger">Incorrect password</Alert>
		} else if (feedbackStatus !== true) {
			feedbackComponent = <Alert variant="danger">Feedback error <b>{feedbackStatus}</b></Alert>
		}
		return (<Container>
			{feedbackComponent}
			<FormGroup className="mb-3">
				<FloatingLabel controlId="floatingPassword" label="Password (leave blank if none)"><FormControl type="password" placeholder="Password" onChange={(event) => this.setState({ ...this.state, password: event.target.value })}/></FloatingLabel>
			</FormGroup>
			<FormGroup className="mb-3">
				{isInQueue == true
					? <Button variant="danger" onClick={this.stop.bind(this)}>Stop queuing</Button>
					: <Button variant="success" onClick={this.start.bind(this)}>Start queuing</Button>
				}
			</FormGroup>
			<FormGroup className="mb-3">
				<FormCheck type="checkbox" label="Restart the queue if you're not connected at the end of it?" checked={restartQueue} onChange={this.toggleRestartQueue.bind(this)}/>
			</FormGroup>
			
			<Row>
				<Col xs="12" sm="6" md="4" lg="3">Place in queue</Col>
				<Col xs="12" sm="6" md="4" lg="3">{queuePlace}</Col>
			</Row>
			<Row>
				<Col xs="12" sm="6" md="4" lg="3">ETA</Col>
				<Col xs="12" sm="6" md="4" lg="3">{ETA}</Col>
			</Row>
		</Container>)
	}
}

