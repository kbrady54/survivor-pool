import React, {Component} from 'react';
import * as Redux from 'react-redux';
import * as actions from 'actions';
import * as Requests from 'Requests';

import DisplayTeam from 'DisplayTeam';

class TeamInfo extends Component {
	constructor(props) {
		super(props);
		this.state = {uid: null, displayName: null, teams: null};
		this.refreshTeamDisplay = this.refreshTeamDisplay.bind(this);
	}
	componentDidMount() {
		var {dispatch} = this.props;
		var {uid, displayName} = dispatch(actions.getUserAuthInfo());

		var that = this;
		var teamName;
		var hasTeam;
		var userTeams;

		Requests.get(`/teams/${uid}`).then(function(teams) {
			if(teams.data !== null) {
				userTeams = teams.data;
			}
			that.setState({uid, displayName, teams: userTeams});
		});
	}
	refreshTeamDisplay(teamName) {
		this.setState({hasTeamName: true, teamName: teamName});
	}
	render() {
		let userID = this.state.uid;
		let teams = this.state.teams;
		let displayName = this.state.displayName;

		var renderTeams = () => {
			if(teams === null || teams.length == 0) {
				return (
					<div className="card">
						<p>You don't have any teams!</p>
					</div>
				)
			} 

			return teams.map((team, index) => {
				return (
					<div className="card" key={index}>
						<DisplayTeam teamID={team.teamID} displayName={displayName} teamName={team.teamName} userID={userID} refreshTeam={this.refreshTeamDisplay}/>
					</div>
				)
			});
		}

		return (
			<div className="card-row">
				{renderTeams()}
			</div>
		)
	}
};

export default Redux.connect()(TeamInfo);