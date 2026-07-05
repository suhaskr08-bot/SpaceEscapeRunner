import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const SHIP_WIDTH = 60;
const SHIP_HEIGHT = 50;
const MOVE_STEP = 20;

const ASTEROID_SIZE = 40;
const FALL_SPEED = 8;
const TICK_RATE = 50;

const SHIP_BOTTOM_OFFSET = 80;
const SHIP_TOP_Y = SCREEN_HEIGHT - SHIP_BOTTOM_OFFSET - SHIP_HEIGHT;

const HIGH_SCORE_KEY = '@SpaceEscapeRunner:highScore';

const getInitialShipX = () => SCREEN_WIDTH / 2 - SHIP_WIDTH / 2;
const getRandomAsteroidX = () => Math.random() * (SCREEN_WIDTH - ASTEROID_SIZE);

export default function Game() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [shipX, setShipX] = useState(getInitialShipX());
  const [asteroidX, setAsteroidX] = useState(getRandomAsteroidX());
  const [asteroidY, setAsteroidY] = useState(-ASTEROID_SIZE);
  const [gameOver, setGameOver] = useState(false);

  const gameLoopRef = useRef<number | null>(null);

  useEffect(() => {
    loadHighScore();
  }, []);

  const loadHighScore = async () => {
    try {
      const savedValue = await AsyncStorage.getItem(HIGH_SCORE_KEY);
      if (savedValue !== null) {
        setHighScore(parseInt(savedValue, 10));
      }
    } catch (error) {
      console.log('Failed to load high score:', error);
    }
  };

  const saveHighScore = async (newHighScore: number) => {
    try {
      await AsyncStorage.setItem(HIGH_SCORE_KEY, newHighScore.toString());
    } catch (error) {
      console.log('Failed to save high score:', error);
    }
  };

  const moveLeft = () => {
    setShipX((prevX) => Math.max(prevX - MOVE_STEP, 0));
  };

  const moveRight = () => {
    setShipX((prevX) => Math.min(prevX + MOVE_STEP, SCREEN_WIDTH - SHIP_WIDTH));
  };

  const checkCollision = (shipXPos: number, astXPos: number, astYPos: number) => {
    const shipLeft = shipXPos;
    const shipRight = shipXPos + SHIP_WIDTH;
    const shipTop = SHIP_TOP_Y;
    const shipBottom = SHIP_TOP_Y + SHIP_HEIGHT;

    const astLeft = astXPos;
    const astRight = astXPos + ASTEROID_SIZE;
    const astTop = astYPos;
    const astBottom = astYPos + ASTEROID_SIZE;

    return (
      shipLeft < astRight &&
      shipRight > astLeft &&
      shipTop < astBottom &&
      shipBottom > astTop
    );
  };

  useEffect(() => {
    if (gameOver) return;

    gameLoopRef.current = setInterval(() => {
      setAsteroidY((prevY) => {
        const newY = prevY + FALL_SPEED;

        if (checkCollision(shipX, asteroidX, newY)) {
          if (gameLoopRef.current !== null) clearInterval(gameLoopRef.current);

          setScore((currentScore) => {
            if (currentScore > highScore) {
              setHighScore(currentScore);
              saveHighScore(currentScore);
            }
            return currentScore;
          });

          setGameOver(true);
          return newY;
        }

        if (newY > SCREEN_HEIGHT) {
          setScore((prevScore) => prevScore + 1);
          setAsteroidX(getRandomAsteroidX());
          return -ASTEROID_SIZE;
        }

        return newY;
      });
    }, TICK_RATE);

    return () => {
      if (gameLoopRef.current !== null) clearInterval(gameLoopRef.current);
    };
  }, [shipX, asteroidX, gameOver, highScore]);

  const handleRestart = () => {
    setScore(0);
    setGameOver(false);
    setShipX(getInitialShipX());
    setAsteroidX(getRandomAsteroidX());
    setAsteroidY(-ASTEROID_SIZE);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.title}>Space Escape Runner</Text>

      <View style={styles.scoreRow}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>High Score</Text>
          <Text style={styles.highScoreValue}>{highScore}</Text>
        </View>
      </View>

      {gameOver && (
        <View style={styles.gameOverBox}>
          <Text style={styles.gameOverText}>💥 Game Over</Text>
          <Text style={styles.finalScoreText}>Final Score: {score}</Text>
          <Text style={styles.finalScoreText}>High Score: {highScore}</Text>
          <TouchableOpacity style={styles.button} onPress={handleRestart}>
            <Text style={styles.buttonText}>Restart Game</Text>
          </TouchableOpacity>
        </View>
      )}

      {!gameOver && (
        <View style={[styles.asteroid, { left: asteroidX, top: asteroidY }]} />
      )}

      <View style={[styles.ship, { left: shipX }]}>
        <View style={styles.shipBody} />
        <View style={styles.shipNose} />
        <View style={styles.engineLeft} />
        <View style={styles.engineRight} />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={moveLeft} disabled={gameOver}>
          <Text style={styles.controlButtonText}>◀ Move Left</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={moveRight} disabled={gameOver}>
          <Text style={styles.controlButtonText}>Move Right ▶</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E23',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  scoreBox: {
    backgroundColor: '#1A1F3D',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#3A3F6D',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#9AA0C3',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00E5FF',
  },
  highScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  button: {
    backgroundColor: '#5B5FEF',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 30,
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  asteroid: {
    position: 'absolute',
    width: ASTEROID_SIZE,
    height: ASTEROID_SIZE,
    backgroundColor: '#8B7355',
    borderRadius: ASTEROID_SIZE / 2,
    borderWidth: 2,
    borderColor: '#5C4A38',
  },
  ship: {
    position: 'absolute',
    bottom: SHIP_BOTTOM_OFFSET,
    width: SHIP_WIDTH,
    height: SHIP_HEIGHT,
    alignItems: 'center',
  },
  shipBody: {
    width: 30,
    height: 30,
    backgroundColor: '#C0C6F5',
    borderRadius: 6,
    position: 'absolute',
    top: 15,
  },
  shipNose: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#00E5FF',
    position: 'absolute',
    top: -5,
  },
  engineLeft: {
    width: 8,
    height: 14,
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
    position: 'absolute',
    bottom: 0,
    left: 5,
  },
  engineRight: {
    width: 8,
    height: 14,
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
    position: 'absolute',
    bottom: 0,
    right: 5,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
  },
  controlButton: {
    backgroundColor: '#1A1F3D',
    borderWidth: 1,
    borderColor: '#3A3F6D',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gameOverBox: {
    position: 'absolute',
    top: '35%',
    backgroundColor: '#1A1F3D',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    zIndex: 10,
  },
  gameOverText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 12,
  },
  finalScoreText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
});