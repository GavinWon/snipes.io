import React, { useEffect, useState } from 'react';
import { useParams, useOutlet, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Leaderboard from './Leaderboard';
import TeamSelect from './TeamSelect';
import TargetSelect from './TargetSelect';
import Game from './Game';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useNavigate, useLocation } from 'react-router-dom';

function Lobby() {
    const navigate = useNavigate();
    const location = useLocation();
    const { lobbyID } = useParams();
    const { token } = useAuth();
    const outlet = useOutlet();

    const [gameState, setGameState] = useState();
    const [team1, setTeam1] = useState([]);
    const [team2, setTeam2] = useState([]);
    const [targets, setTargets] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [ alert, setAlert ] = useState(false);
    const [ alertMessage, setAlertMessage ] = useState("");
    const [leaderboard, setLeaderboard] = useState([]);

    console.log(lobbyID);

    const getLobby = async () => {
        try {
            const response = await fetch('http://'+window.location.hostname+':8080/gameModel/'+lobbyID, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                },
            }).then(data => {
                statusCheck(data)
                return data.json()
            });
            // Need: lobby DNE error code, no permission error code, success code
            // Set gameState: teamSelect, targetSelect, inProgress
            setGameState(response?.state);
            setTeam1(response?.team1.map((i) => i.userID));
            setTeam2(response?.team2.map((i) => i.userID));
            setTargets(response?.objects.map((i) => i.object).sort());
            setPhotos(response?.photos.map((i) => {return {image: i.image, username: i.user, timestamp: parseInt(i.timestamp), target: i.object}}));
            setLeaderboard(response?.leaderboard.map((i) => {return {user: i.userID, points: i.points*1000, team: i.team}}));
        }
        catch (e) {
            console.log('Fetch lobby failed: ' + e);
        }
    };

    useEffect(() => {
        getLobby();
        const interval = setInterval(() => {
            getLobby();
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const statusCheck = (data) => {
        if (data.status === 401) {
            navigate('/login', {state: {from: location, alert: true}})
        } else if (data.status === 403) {
            setAlert(true);
            setAlertMessage("Game has already started. Cannot access this game.");
            throw new Error("Game has already started. Cannot access this game.");
        } else if (data.status === 404) {
            setAlert(true);
            setAlertMessage("Lobby game ID does not exist");
            throw new Error("Lobby Game ID does not exist");
        } else if (data.status === 500) {
            setAlert(true);
            setAlertMessage("Error with the Server. Please try again at another time");
            throw new Error("Error with the Server");
        }
    }

    const handleReturn = async (event) => {
        navigate('/home')
    }

    // TODO: Lobby logic (@BACKEND)
    // If lobby does not exist, return lobby DNE error code. 
    // Frontend can diplay alert: Lobby not found.
    // Otherwise if gameState=="teamSelect", add user to lobby and return success code and current gameState ("teamSelect")
    // Frontend will display the TeamScreen
    // Otherwise, (in target select or game in progress) if user not in lobby, return no permissions error code. 
    // Frontend will redirect back to home screen. Maybe display alert: Game already started.
    // Otherwise, return success code and current gameState ("targetSelect" or "inProgress")
    // Frontend will display the proper screen

    return (
            outlet === null ?
            (gameState === 'open' ? <TeamSelect lobbyID={lobbyID} team1={team1} team2={team2}></TeamSelect> :
            gameState === 'target_select' ? <TargetSelect lobbyID={lobbyID} targets={targets}></TargetSelect> : 
            gameState === 'in_progress' ? <Game lobbyID={lobbyID} targets={targets} leaderboard={leaderboard}></Game> : 
            gameState === 'game_over' ? <Leaderboard lobbyID={lobbyID} leaderboard={leaderboard}></Leaderboard> : 
            alert ? 
            <div>
                <Alert severity='error' onClose={() => setAlert(false)}>{alertMessage}</Alert>
                <Box component="form" onSubmit={handleReturn}>
                    <Button
                        type="submit"
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Return back to Home Screen
                    </Button>
                </Box>
            </div> : <></>) :  
            <Outlet context={[lobbyID, photos, targets]} />
    );
}

export default Lobby