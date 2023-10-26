import express from "express";
import $ from "jquery";
import bodyParser from "body-parser";
import axios from "axios";
const app = express();
const port = 3000;
const apiKey = "RGAPI-fe9ff7f9-c4a9-44f3-962e-f7687dbdc962";

function unixTimeToMinutes(unixTime) {
    return Math.floor(unixTime / 60); // Divide por 60 para convertir de segundos a minutos
  }

const obtenerFechas = () =>{
    // URL completa con el nombre del invocador y la clave de API

    // Obtén la fecha actual
    const currentDate = new Date();

    // Calcula la fecha de inicio como el día actual hace un mes
    const start_date = new Date(currentDate);
    start_date.setMonth(currentDate.getMonth() - 1);

    // Convierte las fechas a timestamps UNIX en segundos
    const start_timestamp = Math.floor(start_date.getTime() / 1000);
    const end_timestamp = Math.floor(currentDate.getTime() / 1000);

    console.log(`Fecha de inicio en timestamp: ${start_timestamp}`);
    console.log(`Fecha de finalización en timestamp: ${end_timestamp}`);
    return {
        start_timestamp: start_timestamp,
        end_timestamp: end_timestamp
    };
};

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/",(req, res)=>{
    res.render("inicio.ejs", {
        content: "api response",
    });
});

app.post("/search", async (req, res) => {
    const fechas = obtenerFechas();
    const summonerName = req.body.summonerName;
    const playerRegion = req.body.region;
    const data = [];
    if (!summonerName) {
        return res.redirect("/");
    }
        /* OBTENER LOS IDENTIFICADORES DEL JUGADOR */
    const url = `https://${playerRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}?api_key=${apiKey}`;
    try {
        const response = await axios.get(url);
        const result = response.data;
        data.push(result);

        /* OBTENER LAS LIGAS DEL JUGADOR */
        const playerId = result.id;
        const url2 = `https://${playerRegion}.api.riotgames.com/lol/league/v4/entries/by-summoner/${playerId}?api_key=${apiKey}`;
        const response2 = await axios.get(url2);
        const result2 = response2.data;
        data.push(result2);

        /* OBTENER EL ID DE LAS PARTIDAS JUGADAS */
        const url3 = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${result.puuid}/ids?startTime=${fechas.start_timestamp}&endTime=${fechas.end_timestamp}&start=0&count=20&api_key=${apiKey}`
        const response3 = await axios.get(url3);
        const games = response3.data;
        console.log("partidas encontradas:");
        console.log(games);

        /* OBTENER LOS DATOS DE LAS PARTIDAS JUGADAS */
                  
        
        // Divide el array `games` en dos grupos.
        const middleIndex = Math.floor(games.length / 2);
        const firstGroup = games.slice(0, middleIndex);
        const secondGroup = games.slice(middleIndex);
        
        async function fetchData(group) {
          const gameDataArray = await Promise.all(group.map(async (element) => {            
            const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${element}?api_key=${apiKey}`;
            const response = await axios.get(url);
            return response.data;
          }));
        
          return gameDataArray;
        }
        
        // Solicita los datos de los juegos para el primer grupo de IDs.
        const firstGroupData = await fetchData(firstGroup);
        
        // Solicita los datos de los juegos para el segundo grupo de IDs.
        const secondGroupData = await fetchData(secondGroup);
        
        // Combina los resultados de los dos grupos en un solo arreglo.
        const combinedData = firstGroupData.concat(secondGroupData);
        data.push(combinedData);
        //console.log('Datos combinados:', combinedData);
        


        
        const informacionIkurama = {
            summonerName: summonerName,
            kills: 0,
            deaths: 0,
            assists: 0,
            queue: {
              flex: {
                kills: 0,
                deaths: 0,
                assists: 0,
                playCount: 0,
                wins: 0,
                losses: 0,
                position: {
                  top: 0,
                  jungle: 0,
                  middle: 0,
                  bottom: 0,
                  utility: 0
                },
                champions: {}
              },
              soloduo: {
                kills: 0,
                deaths: 0,
                assists: 0,
                playCount: 0,
                wins: 0,
                losses: 0,
                position: {
                  top: 0,
                  jungle: 0,
                  middle: 0,
                  bottom: 0,
                  utility: 0
                },
                champions: {}
              },
              normal: {
                kills: 0,
                deaths: 0,
                assists: 0,
                playCount: 0,
                wins: 0,
                losses: 0,
                position: {
                  top: 0,
                  jungle: 0,
                  middle: 0,
                  bottom: 0,
                  utility: 0
                },
                champions: {}
              }
            }
          };
          
          combinedData.forEach(partida => {
            const ikuramaInfo = partida.info.participants.find(participante => participante.summonerName === summonerName);
            let queueType;
            let totalMinionsk = ikuramaInfo.neutralMinionsKilled + ikuramaInfo.totalMinionsKilled;
            console.log("total minions");
            console.log(totalMinionsk);
            if (ikuramaInfo) {
              informacionIkurama.kills += ikuramaInfo.kills;
              informacionIkurama.deaths += ikuramaInfo.deaths;
              informacionIkurama.assists += ikuramaInfo.assists;
          
              if (ikuramaInfo.championName) {
                const queueId = partida.info.queueId;
                              
                if (queueId === 420) {
                  queueType = 'soloduo';
                } else if (queueId === 440) {
                  queueType = 'flex';
                } else if (queueId === 400) {
                  queueType = 'normal';
                }
          
                if (!queueType) {
                  return;
                }
          
                if (ikuramaInfo.win === true) {
                  informacionIkurama.queue[queueType].wins += 1;
                } else {
                  informacionIkurama.queue[queueType].losses += 1;
                }
          
                // Incrementa el contador de posición correspondiente
                switch (ikuramaInfo.individualPosition) {
                  case 'TOP':
                    informacionIkurama.queue[queueType].position.top += 1;
                    break;
                  case 'JUNGLE':
                    informacionIkurama.queue[queueType].position.jungle += 1;
                    break;
                  case 'MIDDLE':
                    informacionIkurama.queue[queueType].position.middle += 1;
                    break;
                  case 'BOTTOM':
                    informacionIkurama.queue[queueType].position.bottom += 1;
                    break;
                  case 'UTILITY':
                    informacionIkurama.queue[queueType].position.utility += 1;
                    break;
                  default:
                    break;
                }
               
                informacionIkurama.queue[queueType].playCount++;
                informacionIkurama.queue[queueType].kills += ikuramaInfo.kills;
                informacionIkurama.queue[queueType].deaths += ikuramaInfo.deaths;
                informacionIkurama.queue[queueType].assists += ikuramaInfo.assists;
          
                if (!informacionIkurama.queue[queueType].champions[ikuramaInfo.championName]) {                  
                  informacionIkurama.queue[queueType].champions[ikuramaInfo.championName] = {
                    name: ikuramaInfo.championName,
                    wins: 0,
                    losses: 0,
                    playCount: 1,
                    kills: ikuramaInfo.kills,
                    deaths: ikuramaInfo.deaths,
                    assists: ikuramaInfo.assists,
                    timePlayed: partida.info.gameDuration,
                    totalMinionsKilled: totalMinionsk
                  };
                } else {
                  informacionIkurama.queue[queueType].champions[ikuramaInfo.championName].playCount++;
                  informacionIkurama.queue[queueType].champions[ikuramaInfo.championName].kills += ikuramaInfo.kills;
                  informacionIkurama.queue[queueType].champions[ikuramaInfo.championName].deaths += ikuramaInfo.deaths;
                  informacionIkurama.queue[queueType].champions[ikuramaInfo.championName].assists += ikuramaInfo.assists;
                  informacionIkurama.queue[queueType].champions[ikuramaInfo.championName].timePlayed += partida.info.gameDuration;
                  informacionIkurama.queue[queueType].champions[ikuramaInfo.championName].totalMinionsKilled += totalMinionsk;
                }
          
                if (partida.info.teams[0].win === true && ikuramaInfo.teamId === 100) {
                  informacionIkurama.queue[queueType].champions[ikuramaInfo.championName].wins += 1;
                } else if (partida.info.teams[1].win === true && ikuramaInfo.teamId === 200) {
                  informacionIkurama.queue[queueType].champions[ikuramaInfo.championName].wins += 1;
                } else {
                  informacionIkurama.queue[queueType].champions[ikuramaInfo.championName].losses += 1;
                }
              }
            }
          });  
          const championsStats = {
            champions: {}
          };
          
          // Combinar y sumar estadísticas de campeones en nuevoObjeto
          Object.keys(informacionIkurama.queue.flex.champions).forEach(championName => {
            
            if (championsStats.champions[championName]) {
            championsStats.champions[championName].kills += informacionIkurama.queue.flex.champions[championName].kills;
            championsStats.champions[championName].deaths += informacionIkurama.queue.flex.champions[championName].deaths;
            championsStats.champions[championName].assists += informacionIkurama.queue.flex.champions[championName].assists;
            championsStats.champions[championName].wins += informacionIkurama.queue.flex.champions[championName].wins;
            championsStats.champions[championName].losses += informacionIkurama.queue.flex.champions[championName].losses;
            championsStats.champions[championName].playCount += informacionIkurama.queue.flex.champions[championName].playCount;
            championsStats.champions[championName].timePlayed += informacionIkurama.queue.flex.champions[championName].timePlayed;
            championsStats.champions[championName].totalMinionsKilled += informacionIkurama.queue.flex.champions[championName].totalMinionsKilled;
            } else {
            championsStats.champions[championName] = { ...informacionIkurama.queue.flex.champions[championName] };
            }
          });
          
          Object.keys(informacionIkurama.queue.soloduo.champions).forEach(championName => {
            if (championsStats.champions[championName]) {
            championsStats.champions[championName].kills += informacionIkurama.queue.soloduo.champions[championName].kills;
            championsStats.champions[championName].deaths += informacionIkurama.queue.soloduo.champions[championName].deaths;
            championsStats.champions[championName].assists += informacionIkurama.queue.soloduo.champions[championName].assists;
            championsStats.champions[championName].wins += informacionIkurama.queue.soloduo.champions[championName].wins;
            championsStats.champions[championName].losses += informacionIkurama.queue.soloduo.champions[championName].losses;
            championsStats.champions[championName].playCount += informacionIkurama.queue.soloduo.champions[championName].playCount;
            championsStats.champions[championName].timePlayed += informacionIkurama.queue.soloduo.champions[championName].timePlayed;
            championsStats.champions[championName].totalMinionsKilled += informacionIkurama.queue.soloduo.champions[championName].totalMinionsKilled;
            } else {
            championsStats.champions[championName] = { ...informacionIkurama.queue.soloduo.champions[championName] };
            }
          });          
          data.push(championsStats);         
          data.push(informacionIkurama);                          
        
        console.log("game data");
        console.log(data);
        res.render("jugador.ejs", {
            content: data,
        });
    } catch (error) {
        res.status(404).send(error.message);
    }
});



app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
  });  

  
