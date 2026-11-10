import { useState, useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  List,
  PaperProvider,
  Switch,
  Text,
  MD3LightTheme as DefaultTheme,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";
import openDB from "./db";

const db = openDB();

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]);

  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });

  async function loadDarkMode() {
    try {
      const value = await AsyncStorage.getItem("@darkMode");
      if (value !== null) {
        setIsSwitchOn(value === "true");
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function onToggleSwitch() {
    const novoValor = !isSwitchOn;
    setIsSwitchOn(novoValor);

    try {
      await AsyncStorage.setItem("@darkMode", novoValor.toString());
    } catch (e) {
      console.log(e);
    }
  }

  async function getLocation() {
    setIsLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        alert("Permissão de localização negada");
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});

      await db.runAsync(
        "INSERT INTO locations (latitude, longitude) VALUES (?, ?)",
        [location.coords.latitude, location.coords.longitude]
      );

      await loadLocations();
    } catch (e) {
      console.log(e);
    }

    setIsLoading(false);
  }

  async function loadLocations() {
    setIsLoading(true);

    try {
      const rows = await db.getAllAsync("select * from locations");
      setLocations(rows);
    } catch (e) {
      console.log(e);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadDarkMode();
    loadLocations();
  }, []);

  useEffect(() => {
    if (isSwitchOn) {
      setTheme({ ...theme, colors: myColorsDark.colors });
    } else {
      setTheme({ ...theme, colors: myColors.colors });
    }
  }, [isSwitchOn]);

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="My Location" />
      </Appbar.Header>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={styles.containerDarkMode}>
          <Text>Dark Mode</Text>
          <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
        </View>
        <Button
          style={styles.containerButton}
          icon="map"
          mode="contained"
          loading={isLoading}
          onPress={() => getLocation()}
        >
          Capturar localização
        </Button>

        <FlatList
          style={styles.containerList}
          data={locations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <List.Item
              title={`Localização ${item.id}`}
              description={`Latitude: ${item.latitude} | Longitude: ${item.longitude}`}
            ></List.Item>
          )}
        ></FlatList>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  containerDarkMode: {
    margin: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerButton: {
    margin: 10,
  },
  containerList: {
    margin: 10,
  },
});
