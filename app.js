import express from "express";
import $ from "jquery";
import bodyParser from "body-parser";
import axios from "axios";
const app = express();
const port = 3000;
const apiKey = "RGAPI-2c7a3ee6-307c-43cb-905c-da602973b88d";

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
        


        
        const informacionPlayer = {
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
                champions: []
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
                champions: []
              },
              nexusBlitz: {
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
                champions: []
              },
              aram: {
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
                champions: []
              }
            }
          };
          
          combinedData.forEach(partida => {
            const playerInfo = partida.info.participants.find(participante => participante.summonerName === summonerName);
            let queueType;
            let totalMinionsk = playerInfo.neutralMinionsKilled + playerInfo.totalMinionsKilled;
            console.log("total minions");
            console.log(totalMinionsk);
            if (playerInfo) {
              informacionPlayer.kills += playerInfo.kills;
              informacionPlayer.deaths += playerInfo.deaths;
              informacionPlayer.assists += playerInfo.assists;
          
              if (playerInfo.championName) {
                const queueId = partida.info.queueId;
                              
                if (queueId === 420) {
                  queueType = 'soloduo';
                } else if (queueId === 440) {
                  queueType = 'flex';
                } else if (queueId === 400 || queueId === 430) {
                  queueType = 'normal';
                } else if (queueId === 1300) {
                  queueType = 'nexusBlitz';
                } else if (queueId === 450 || queueId === 100) {
                  queueType = 'aram';
                }
          
                if (!queueType) {
                  return;
                }
          
                if (playerInfo.win === true) {
                  informacionPlayer.queue[queueType].wins += 1;
                } else {
                  informacionPlayer.queue[queueType].losses += 1;
                }
          
                // Incrementa el contador de posición correspondiente
                switch (playerInfo.individualPosition) {
                  case 'TOP':
                    informacionPlayer.queue[queueType].position.top += 1;
                    break;
                  case 'JUNGLE':
                    informacionPlayer.queue[queueType].position.jungle += 1;
                    break;
                  case 'MIDDLE':
                    informacionPlayer.queue[queueType].position.middle += 1;
                    break;
                  case 'BOTTOM':
                    informacionPlayer.queue[queueType].position.bottom += 1;
                    break;
                  case 'UTILITY':
                    informacionPlayer.queue[queueType].position.utility += 1;
                    break;
                  default:
                    break;
                }
               
                informacionPlayer.queue[queueType].playCount++;
                informacionPlayer.queue[queueType].kills += playerInfo.kills;
                informacionPlayer.queue[queueType].deaths += playerInfo.deaths;
                informacionPlayer.queue[queueType].assists += playerInfo.assists;
          
                if (!informacionPlayer.queue[queueType].champions[playerInfo.championName]) {                  
                  informacionPlayer.queue[queueType].champions[playerInfo.championName] = {
                    name: playerInfo.championName,
                    wins: 0,
                    losses: 0,
                    playCount: 1,
                    kills: playerInfo.kills,
                    deaths: playerInfo.deaths,
                    assists: playerInfo.assists,
                    timePlayed: partida.info.gameDuration,
                    totalMinionsKilled: totalMinionsk
                  };
                } else {
                  informacionPlayer.queue[queueType].champions[playerInfo.championName].playCount++;
                  informacionPlayer.queue[queueType].champions[playerInfo.championName].kills += playerInfo.kills;
                  informacionPlayer.queue[queueType].champions[playerInfo.championName].deaths += playerInfo.deaths;
                  informacionPlayer.queue[queueType].champions[playerInfo.championName].assists += playerInfo.assists;
                  informacionPlayer.queue[queueType].champions[playerInfo.championName].timePlayed += partida.info.gameDuration;
                  informacionPlayer.queue[queueType].champions[playerInfo.championName].totalMinionsKilled += totalMinionsk;
                }
          
                if (partida.info.teams[0].win === true && playerInfo.teamId === 100) {
                  informacionPlayer.queue[queueType].champions[playerInfo.championName].wins += 1;
                } else if (partida.info.teams[1].win === true && playerInfo.teamId === 200) {
                  informacionPlayer.queue[queueType].champions[playerInfo.championName].wins += 1;
                } else {
                  informacionPlayer.queue[queueType].champions[playerInfo.championName].losses += 1;
                }
              }
            }
          });  
          const championsStats = {
            champions: {}
          };
          
          // Combinar y sumar estadísticas de campeones en nuevoObjeto
          Object.keys(informacionPlayer.queue.flex.champions).forEach(championName => {
            
            if (championsStats.champions[championName]) {
            championsStats.champions[championName].kills += informacionPlayer.queue.flex.champions[championName].kills;
            championsStats.champions[championName].deaths += informacionPlayer.queue.flex.champions[championName].deaths;
            championsStats.champions[championName].assists += informacionPlayer.queue.flex.champions[championName].assists;
            championsStats.champions[championName].wins += informacionPlayer.queue.flex.champions[championName].wins;
            championsStats.champions[championName].losses += informacionPlayer.queue.flex.champions[championName].losses;
            championsStats.champions[championName].playCount += informacionPlayer.queue.flex.champions[championName].playCount;
            championsStats.champions[championName].timePlayed += informacionPlayer.queue.flex.champions[championName].timePlayed;
            championsStats.champions[championName].totalMinionsKilled += informacionPlayer.queue.flex.champions[championName].totalMinionsKilled;
            } else {
            championsStats.champions[championName] = { ...informacionPlayer.queue.flex.champions[championName] };
            }
          });
          
          Object.keys(informacionPlayer.queue.soloduo.champions).forEach(championName => {
            if (championsStats.champions[championName]) {
            championsStats.champions[championName].kills += informacionPlayer.queue.soloduo.champions[championName].kills;
            championsStats.champions[championName].deaths += informacionPlayer.queue.soloduo.champions[championName].deaths;
            championsStats.champions[championName].assists += informacionPlayer.queue.soloduo.champions[championName].assists;
            championsStats.champions[championName].wins += informacionPlayer.queue.soloduo.champions[championName].wins;
            championsStats.champions[championName].losses += informacionPlayer.queue.soloduo.champions[championName].losses;
            championsStats.champions[championName].playCount += informacionPlayer.queue.soloduo.champions[championName].playCount;
            championsStats.champions[championName].timePlayed += informacionPlayer.queue.soloduo.champions[championName].timePlayed;
            championsStats.champions[championName].totalMinionsKilled += informacionPlayer.queue.soloduo.champions[championName].totalMinionsKilled;
            } else {
            championsStats.champions[championName] = { ...informacionPlayer.queue.soloduo.champions[championName] };
            }
          });      
          Object.keys(informacionPlayer.queue.normal.champions).forEach(championName => {
            if (championsStats.champions[championName]) {
            championsStats.champions[championName].kills += informacionPlayer.queue.normal.champions[championName].kills;
            championsStats.champions[championName].deaths += informacionPlayer.queue.normal.champions[championName].deaths;
            championsStats.champions[championName].assists += informacionPlayer.queue.normal.champions[championName].assists;
            championsStats.champions[championName].wins += informacionPlayer.queue.normal.champions[championName].wins;
            championsStats.champions[championName].losses += informacionPlayer.queue.normal.champions[championName].losses;
            championsStats.champions[championName].playCount += informacionPlayer.queue.normal.champions[championName].playCount;
            championsStats.champions[championName].timePlayed += informacionPlayer.queue.normal.champions[championName].timePlayed;
            championsStats.champions[championName].totalMinionsKilled += informacionPlayer.queue.normal.champions[championName].totalMinionsKilled;
            } else {
            championsStats.champions[championName] = { ...informacionPlayer.queue.normal.champions[championName] };
            }
          });     
          Object.keys(informacionPlayer.queue.nexusBlitz.champions).forEach(championName => {
            if (championsStats.champions[championName]) {
            championsStats.champions[championName].kills += informacionPlayer.queue.nexusBlitz.champions[championName].kills;
            championsStats.champions[championName].deaths += informacionPlayer.queue.nexusBlitz.champions[championName].deaths;
            championsStats.champions[championName].assists += informacionPlayer.queue.nexusBlitz.champions[championName].assists;
            championsStats.champions[championName].wins += informacionPlayer.queue.nexusBlitz.champions[championName].wins;
            championsStats.champions[championName].losses += informacionPlayer.queue.nexusBlitz.champions[championName].losses;
            championsStats.champions[championName].playCount += informacionPlayer.queue.nexusBlitz.champions[championName].playCount;
            championsStats.champions[championName].timePlayed += informacionPlayer.queue.nexusBlitz.champions[championName].timePlayed;
            championsStats.champions[championName].totalMinionsKilled += informacionPlayer.queue.nexusBlitz.champions[championName].totalMinionsKilled;
            } else {
            championsStats.champions[championName] = { ...informacionPlayer.queue.nexusBlitz.champions[championName] };
            }
          });     
          Object.keys(informacionPlayer.queue.aram.champions).forEach(championName => {
            if (championsStats.champions[championName]) {
            championsStats.champions[championName].kills += informacionPlayer.queue.aram.champions[championName].kills;
            championsStats.champions[championName].deaths += informacionPlayer.queue.aram.champions[championName].deaths;
            championsStats.champions[championName].assists += informacionPlayer.queue.aram.champions[championName].assists;
            championsStats.champions[championName].wins += informacionPlayer.queue.aram.champions[championName].wins;
            championsStats.champions[championName].losses += informacionPlayer.queue.aram.champions[championName].losses;
            championsStats.champions[championName].playCount += informacionPlayer.queue.aram.champions[championName].playCount;
            championsStats.champions[championName].timePlayed += informacionPlayer.queue.aram.champions[championName].timePlayed;
            championsStats.champions[championName].totalMinionsKilled += informacionPlayer.queue.aram.champions[championName].totalMinionsKilled;
            } else {
            championsStats.champions[championName] = { ...informacionPlayer.queue.aram.champions[championName] };
            }
          });    
         
         
          // Convierte los valores del objeto "champions" en un arreglo de objetos
          const campeonesArray = Object.entries(championsStats.champions).map(([nombre, datos]) => ({ nombre, ...datos }));
          
          // Ordena el arreglo de campeones por la propiedad deseada (por ejemplo, "playCount")
          campeonesArray.sort((a, b) => b.playCount - a.playCount);
          
          // Crea un nuevo objeto con los nombres de campeón como claves
          const campeonesOrdenados = {
            champions:{}
          };
          campeonesArray.forEach(campeon => {
            campeonesOrdenados.champions[campeon.nombre] = campeon;
          });
          

          
          
          // Convierte los valores del objeto "champions" en un arreglo de objetos
          const campeonesArrayFlex = Object.entries(informacionPlayer.queue.flex.champions).map(([nombre, datos]) => ({ nombre, ...datos }));
          
          // Ordena el arreglo de campeones por la propiedad deseada (por ejemplo, "playCount")
          campeonesArrayFlex.sort((a, b) => b.playCount - a.playCount);
          
          // Crea un nuevo objeto con los campeones ordenados
          const campeonesOrdenadosFlex = {};
          
          campeonesArrayFlex.forEach(campeon => {
            campeonesOrdenadosFlex[campeon.nombre] = campeon;
          });
          
          // Actualiza la propiedad "champions" del objeto "flex" con los campeones ordenados
          informacionPlayer.queue.flex.champions = campeonesOrdenadosFlex;          
          

          // Convierte los valores del objeto "champions" en un arreglo de objetos
          const campeonesArraySolo = Object.entries(informacionPlayer.queue.soloduo.champions).map(([nombre, datos]) => ({ nombre, ...datos }));
          
          // Ordena el arreglo de campeones por la propiedad deseada (por ejemplo, "playCount")
          campeonesArraySolo.sort((a, b) => b.playCount - a.playCount);
          
          // Crea un nuevo objeto con los campeones ordenados
          const campeonesOrdenadosSolo = {};
          
          campeonesArraySolo.forEach(campeon => {
            campeonesOrdenadosSolo[campeon.nombre] = campeon;
          });
          
          // Actualiza la propiedad "champions" del objeto "flex" con los campeones ordenados
          informacionPlayer.queue.soloduo.champions = campeonesOrdenadosSolo;  

          console.log("orden");
          console.log(informacionPlayer.queue.flex.champions);
          data.push(campeonesOrdenados);         
          data.push(informacionPlayer);                          
        
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

  
