import React, { useState, useEffect, useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LoginScreen, RegisterScreen, HomeScreen, loggedInContext, PMScreen, GroupScreen, JoinGroupScreen, CoolClubScreen, FindUsersScreen, ConvScreen } from './App'
import { StyleSheet, Text, View, TextInput, Button, TouchableHighlight, TouchableOpacity, Image, SafeAreaView, ScrollView,  LogBox } from 'react-native';


const Stack = createNativeStackNavigator();

const MainScreenNavigator = () => {
    const [loggedIn, setLoggedIn] = useContext(loggedInContext)

    const logout = () => {
        fetch("http://213.100.216.138:8080/logout").then((response) => {
        response.json().then((res) => {
            if (res.success) {
            console.log("logged out");
            setLoggedIn(false)
            }
        })
        })
        .catch(function(error) {
        console.log(error);
        throw error;
        });
    }
    return (
        <Stack.Navigator>
            <Stack.Screen
            name="Posts"
            component={HomeScreen}
            options={({ navigation }) => ({ 
                title: 'Posts',
                headerRight: () => (
                  loggedIn ?
                  <Button
                    onPress={() => {
                      logout()
                    }}
                    title="Logout"
                  /> : 
                  <Button
                    onPress={() => navigation.navigate('Login')}
                    title="Login"
                  />
                ),})}/>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    )
}
export {MainScreenNavigator}

const PMScreenNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="PM" component={PMScreen}
            options={ () => ({ 
                title: 'Private Messages',
                })}/>
            <Stack.Screen name="find users" component={FindUsersScreen}
            options={ () => ({ 
                title: 'Start a new conversation',
                })}/>
            <Stack.Screen name="conversation" component={ConvScreen}
            options={({ route }) => ({ 
                title: `Conversation with ${route.params.user}`,
                })}/>
        </Stack.Navigator>
    )
}
export {PMScreenNavigator}

const GroupScreenNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Group Messages" component={GroupScreen} />
            <Stack.Screen name="Join Group" component={JoinGroupScreen} />
            <Stack.Screen name="Cool Club" component={CoolClubScreen} />
        </Stack.Navigator>
    )
}
export {GroupScreenNavigator}