import React, {Component} from 'react';
import * as Redux from 'react-redux';
import * as actions from 'actions';
import * as Requests from 'Requests';

import Nav from 'Nav';
import Game from 'Game';
import Footer from 'Footer';

class GameList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			disabled: false,
			userID: null,
			games: null, 
			startedGames: null, 
			teamID: this.props.params.teamID,
			pickStarted: false,
			pickTemp: null,
			pick: null,
			allPicks: null
		};
		this.startPick = this.startPick.bind(this);
		this.submitPick = this.submitPick.bind(this);
		this.cancelPick = this.cancelPick.bind(this);
		this.formatGameInfo = this.formatGameInfo.bind(this);
		this.refreshPicks = this.refreshPicks.bind(this);
    }
	componentWillMount() {
		var {dispatch} = this.props;
		var {uid, displayName} = dispatch(actions.getUserAuthInfo());

		if(this.state.userID == null) {
			this.setState({userID: uid});
		}

		var that = this;

		let picked = false;
		let pick = null;

		//Get Games & Picks
		Requests.post('/games/update', {}).then(function(response) {
			Requests.get(`/games/user/${uid}`).then(function(games) {
				let currentWeekGames = games.data;
				Requests.get('/games/started').then(function(started) {
					let startedGames = started.data;
					that.setState({games: currentWeekGames, startedGames});
				}).then(Requests.get(`/picks/${uid}/${that.state.teamID}`).then(function(pick) {
					if(pick.data[0]) {
						let startedGames = that.state.startedGames;
						let disabled = false;
						startedGames.forEach((game) =>  {
							if(game.gameID === pick.data[0].gameID) {
								disabled = true;
							}
						});
						that.setState({picked: true, pick: pick.data[0], disabled});
					}
				}).then(Requests.get(`/picks/all/${uid}/${that.state.teamID}`).then(function(picks) {
					if(picks.data) {
						that.setState({allPicks: picks.data});
					}
				})));
			});
		});
	}
	formatGameInfo(game) {				
		let gameInfo = {
			week: game.week,
			gameID: game.gameID,
			quarter: game.quarter,
			awayImage: `/images/${game.awayTeamName.toLowerCase()}.gif`,
			awayTeamName: game.awayTeamName,
			homeImage: `/images/${game.homeTeamName.toLowerCase()}.gif`,
			homeTeamName: game.homeTeamName,
			started: game.started,
			homeScore: game.homeScore,
			awayScore: game.awayScore,
			kickoffTime: game.time,
			kickoffDate: game.gameDate.substring(4,6) + "/" + game.gameDate.substring(6,8) + "/" + game.gameDate.substring(0,4)
		};

		switch(game.quarter) {
			case "P":
				gameInfo.quarterText = "Pregame";
				break;
			case "H":
				gameInfo.quarterText = "Half-Time";
				break;
			case "F":
				gameInfo.quarterText = "Final";
				break;
			case "FO":
				gameInfo.quarterText = "Final / Overtime";
			default:
				gameInfo.quarterText = 'Q' + game.quarter;
		}

		return gameInfo;
	}	
	startPick(pick) {
		if(pick !== null) {
			this.setState({pickStarted: true, pickTemp: pick});
		}
	}
	cancelPick() {
		this.setState({pickStarted: false, pickTemp: null});
		this.refreshPicks();
	}
	submitPick() {
		let that = this;
		this.state.pickTemp.teamName = this.state.pickTemp.teamPicked;

        Requests.post(`/picks/${this.state.teamID}`, this.state.pickTemp)
            .then(function(res) {
				that.setState({pickStarted: false, pick: null});
				that.refreshPicks();
            })
            .catch(function(error) {
                console.log('Error picking game', error);
            });
	}
	refreshPicks() {
		var that = this;

		Requests.get(`/picks/${this.state.userID}/${this.state.teamID}`).then(function(pick) {
			if(pick.data[0]) {
				that.setState({picked: true, pick: pick.data[0]});
			}
		});
	}
	render() {
		let allPicks = this.state.allPicks;
		let games = this.state.games;
		let started = this.state.startedGames;

		let week = games !== null ? games[0].week : 0;

		var renderGames = () => {
			if(games === null || games.length == 0) {
				return (
					 <div className="pick-card-row">
						<div className="pick-card">
							<div className="pick-card-content">
								 Loading Games...
							</div>
						</div>
					</div>
				)
			}
			games.forEach(function(game) {
				game.disabledAway = false;
				game.disabledHome = false;

				started.forEach(function(start) {
					if(start.gameID == game.gameID) {
						game.started = true;
					}
				});
				if(allPicks.length > 0) {
					allPicks.forEach(function(pick) {
						if(pick.week !== game.week) {
							game.disabledAway = pick.teamName === game.awayTeamName ? true : false;
							game.disabledHome = pick.teamName === game.homeTeamName ? true : false;
						}
					});
				}
			});

			return games.map((game) => {
				let formattedGame = this.formatGameInfo(game);

				if(this.state.pickTemp !== null) {
					if(formattedGame.gameID == this.state.pickTemp.gameID) {
						formattedGame.pickedGame = true;
						formattedGame.pickedTeam = this.state.pickTemp.teamPicked;
					}
				} else if(this.state.pick !== null) {
					if(formattedGame.gameID == this.state.pick.gameID) {
						formattedGame.pickedGame = true;
						formattedGame.pickedTeam = this.state.pick.teamName;
					}
				}

				return (
					<Game 
						key={game.gameID} 
						disabled={this.state.disabled}
						disabledAway={game.disabledAway}
						disabledHome={game.disabledHome}
						teamID={this.state.teamID} 
						userID={this.state.userID} 
						startPick={this.startPick}
						submitPick={this.submitPick}
						cancelPick={this.cancelPick}
						pick={this.state.pick}
						pickTemp={this.state.pickTemp}
						pickStarted={this.state.pickStarted}
						picked={this.state.picked}
					{...formattedGame}/>
				)
			})
		}

		return (
			<div className="dashboard">
				<Nav page={'Picks'} />
				<div className="row">
					<div className="column small-centered small-11 medium-10 large-9">
						<div className="dashboard-title">Week {week}</div>
						<div className="container">
							{renderGames()}
						</div>
					</div>
				</div>
				<div className="row">
					<Footer />
				</div>
			</div>
		)
	}
};

export default Redux.connect()(GameList);