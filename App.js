import React, { useState, useEffect, useContext, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button, TouchableHighlight, TouchableOpacity, Image, Modal, Pressable, ScrollView,  LogBox, Icon } from 'react-native';
import { NavigationContainer, useRoute, useNavigationContainerRef  } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {BlurView} from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import mime from "mime";
import DialogInput from 'react-native-dialog-input';
import { MainScreenNavigator, PMScreenNavigator, GroupScreenNavigator } from './CustomNavigation'
import io from 'socket.io-client';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state.',
  'Require cycle: App.js -> CustomNavigation.js -> App.js'
]);

// import AppContext from "./AppContext";

export const loggedInContext = React.createContext() 

const Tab = createBottomTabNavigator();

export default function App() {
  const [loggedIn, setLoggedIn] = useState()

  const navigationRef = useNavigationContainerRef();
  return (
    <>
    <loggedInContext.Provider value={[loggedIn, setLoggedIn]}>
      <NavigationContainer ref={navigationRef}>
        <Tab.Navigator
          screenOptions={{
            "headerShown": false,
            "tabBarActiveTintColor": "red",
            "tabBarStyle": [
              {
                "display": "flex"
              },
              null
            ]
          }}>
          <Tab.Screen
            name="Home"
            component={MainScreenNavigator}
            options={{
              tabBarIcon: () => (<Image source={require("./assets/icons/home.png")} style={{width: 20, height: 20}} />)
            }}
          />
          <Tab.Screen 
            name="Private Messages"
            component={PMScreenNavigator}
            options={{
              tabBarIcon: () => (<Image source={require("./assets/icons/messages.png")} style={{width: 20, height: 20}} />)
            }}
          />
          <Tab.Screen 
            name="Groups"
            component={GroupScreenNavigator}
            options={{
              tabBarIcon: () => (<Image source={require("./assets/icons/group.png")} style={{width: 20, height: 20}} />)
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </loggedInContext.Provider>
    </>
  );
}

const HomeScreen = ({ navigation }) => {
  const [posts, setPosts] = useState();
  const [loggedIn, setLoggedIn] = useContext(loggedInContext)
  const [isDialogVisible, setDialogVisible] = useState(false);

  function getPosts() {
    fetch("http://213.100.216.138:8080/posts").then((response) => {
    response.json().then((data) => {
      let textObj = []
      data.posts.forEach((element, i) => {
        textObj.push(
        <View key={i} style={styles.marginBottom}>
          <Text>Content: {element.content}</Text>
          <Text>Creator: {element.publisher}</Text>
        </View>
        )
      });
      setPosts(textObj)
    })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
       // ADD THIS THROW error
        throw error;
      });
    })
  }

  function checkLoggedIn() {
    fetch("http://213.100.216.138:8080/check_loggedIn").then((response) => {
      response.json().then((data) => {
        if (data.isloggedIn === true) {
          setLoggedIn(true)
        }
        else {
          setLoggedIn(false)
        }
      })
      .catch(function(error) {
        console.log('There has been a problem with your fetch operation: ' + error.message);
         // ADD THIS THROW error
          throw error;
        });
      })
  }
  async function createPost(content) {
    let response = await fetch('http://213.100.216.138:8080/create_post', {
          method: 'post',
          body: JSON.stringify({content: content}),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      ).catch(err => console.error(err))
      let responseJson = await response.json();
      if (responseJson.success) {
        getPosts()
      }
  }
  function toggleDialog(bool) {
    setDialogVisible(bool)
  }
  useEffect(() => {
    getPosts()
    navigation.addListener('focus', () => {
      checkLoggedIn()
    });
  }, [navigation]);

  return (
    <View style={styles.groupScreenContainer}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        {loggedIn ? 
        <>
        <Button title="Create Post" onPress={() => {toggleDialog(true)}}></Button>
        <DialogInput isDialogVisible={isDialogVisible}
            title={"Create Post"}
            message={"Post Content:"}
            hintInput ={"content"}
            submitInput={ (inputText) => {createPost(inputText),toggleDialog(false)} }
            closeDialog={ () => {toggleDialog(false)} }>
        </DialogInput>
        </> :
        <Text style={{fontSize:18, textDecorationLine: 'underline', fontWeight: 'bold'}}>log in to create post</Text>}
        {posts}
      </ScrollView>
    </View>
  );
};
export {HomeScreen}

const LoginScreen = ({ navigation, route }) => {
  const [loggedIn, setLoggedIn] = useContext(loggedInContext)
  const [loginDetails, setAllLoginDetails] = useState({username: '', password: ''})

  async function Login() {
    let response = await fetch('http://213.100.216.138:8080/login', {
          method: 'post',
          body: JSON.stringify(loginDetails),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      ).catch(err => console.error(err))
      let responseJson = await response.json();
      console.log(responseJson);
      if (responseJson.success) {
        setLoggedIn(true);
        navigation.navigate('Posts')
      }
  }
  function nav() {
    navigation.navigate('Register')
  }
  return (
    <View style={styles.container} >
      <View style={styles.inputView} >
        <TextInput  
          style={styles.inputText}
          placeholder="Username..." 
          placeholderTextColor="#fff"
          onChangeText={text => setAllLoginDetails({username: text, password: loginDetails.password})}/>
        <TextInput
          style={styles.inputText}
          placeholder="Password..." 
          placeholderTextColor="#fff"
          secureTextEntry={true}
          onChangeText={text => setAllLoginDetails({username: loginDetails.username, password: text})}/>
        {route.params}
        <TouchableOpacity>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={nav}>
          <Text style={styles.loginText}>Signup</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.loginBtn} onPress={Login}>
        <Text style={styles.loginText}>LOGIN</Text>
      </TouchableOpacity>
    </View>
  )
};
export {LoginScreen}

const RegisterScreen = ({ navigation, route }) => {
  const [failureMessage, setFailureMessage] = useState('')
  const [loginDetails, setAllLoginDetails] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    repPassword: ''
  })

  async function Register() {
    let response = await fetch('http://213.100.216.138:8080/register', {
        method: 'post',
        body: JSON.stringify(loginDetails),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    ).catch(err => console.error(err))
    let responseJson = await response.json();
    console.log(responseJson);
    if (responseJson.success) {
      navigation.navigate('Login', <Text style={{color: "green"}}>Sign Up Succesfull, now try to log in</Text>)
    }
    else {
      setFailureMessage(responseJson.failMessage)
    }
  }

  return (
      <View style={styles.container} >
      <View style={styles.inputView} >
        <TextInput  
          style={styles.inputText}
          placeholder="Full Name..." 
          placeholderTextColor="#fff"
          secureTextEntry={false}
          onChangeText={text => setAllLoginDetails({
            fullName: text,
            email: loginDetails.email,
            username: loginDetails.username,
            password: loginDetails.password,
            repPassword: loginDetails.repPassword
          })}/>
        <TextInput
          style={styles.inputText}
          placeholder="Email..."
          placeholderTextColor="#fff"
          secureTextEntry={false}
          onChangeText={text => setAllLoginDetails({
            fullName: loginDetails.fullName,
            email: text,
            username: loginDetails.username,
            password: loginDetails.password,
            repPassword: loginDetails.repPassword
          })}/>
        <TextInput
          style={styles.inputText}
          placeholder="Username..." 
          placeholderTextColor="#fff"
          secureTextEntry={false}
          onChangeText={text => setAllLoginDetails({
            fullName: loginDetails.fullName,
            email: loginDetails.email,
            username: text,
            password: loginDetails.password,
            repPassword: loginDetails.repPassword
          })}/>
        <TextInput  
          style={styles.inputText}
          placeholder="Password..." 
          placeholderTextColor="#fff"
          secureTextEntry={true}
          onChangeText={text => setAllLoginDetails({
            fullName: loginDetails.fullName,
            email: loginDetails.email,
            username: loginDetails.username,
            password: text,
            repPassword: loginDetails.repPassword
          })}/>
        <TextInput  
          style={styles.inputText}
          placeholder="Repeat Password..." 
          placeholderTextColor="#fff"
          secureTextEntry={true}
          onChangeText={text => setAllLoginDetails({
            fullName: loginDetails.fullName,
            email: loginDetails.email,
            username: loginDetails.username,
            password: loginDetails.password,
            repPassword: text
          })}/>
        <Text>{failureMessage}</Text>
      </View>
      <TouchableOpacity style={styles.loginBtn} onPress={Register}>
        <Text style={styles.loginText}>SIGNUP</Text>
      </TouchableOpacity>
    </View>
  )
};
export {RegisterScreen}

const PMScreen = ({ navigation, route }) => {
  const [loggedIn, setLoggedIn] = useContext(loggedInContext)
  const [userId, setUserId] = useState()
  const [users, setUsers] = useState([])
  const [usersRenderer, setUsersRenderer] = useState([])
  function getId() {
    fetch("http://213.100.216.138:8080/getid").then((response) => {
      response.json().then((data) => {
        setUserId(data.userId); 
        setUsers([data.usersId])})
    }).catch((error) => {console.log(error);})
  }
  async function getUsername(id) {
    let response = await fetch('http://213.100.216.138:8080/getusername', {
          method: 'post',
          body: JSON.stringify({id: id}),
          headers: {
            'Content-Type': 'application/json'
          },
        }
      ).catch((err) => {console.log(err);})
      let responseJson = await response.json();
      if (responseJson.success) {
        return responseJson.username
      }
      else {
        return 'no username'
      }
  }
  async function getConvos() {
    fetch("http://213.100.216.138:8080/getConvos").then((response) => {
      response.json().then(async (data) => {
        data.convos.forEach((message) => {
          if ((message.from_ != userId) && ((users.indexOf(message.from_) > -1) == false)) {
            const newUser = users.push(message.from_)
            setUsers(newUser)
          }
          else if ((message.to_ != userId) && ((users.indexOf(message.to_) > -1) == false)) {
            const newUser = users.push(message.to_)
            setUsers(newUser)
          }
        })
        let convosRender = []
        for (let i = 1; i < users.length; i++) {
          const id = users[i];
          const convoUsername = await getUsername(id)
          convosRender.push(
            <TouchableOpacity key={i} onPress={() => 
              navigation.navigate('conversation', {user: convoUsername, userId: id})
            }>
              <View style={styles.convoContainer}>
                  <Text style={styles.convoText}>{convoUsername}</Text>
              </View>
            </TouchableOpacity>
          )
        }
        setUsersRenderer(convosRender)
      })
    }).catch(err => console.log(err));
  }
  
  useEffect(() => {
    navigation.addListener('focus', () => {
      getId()
      getConvos()
      // getimg()
    });
  }, [])
  if (loggedIn == false) { return (
    <View style={styles.groupScreenContainer}>
      <StatusBar style="auto" />
      <Text style={styles.text}>You are not logged in</Text>
    </View>
  )}
  return (
    <View style={styles.groupScreenContainer}>
      <StatusBar style="auto" />
      <TouchableHighlight style={styles.findFriendsTouch}>
        <Button title="Find friends" style={styles.findFriendsButton}
        onPress={() =>
          navigation.navigate('find users')
        }/>
      </TouchableHighlight>
      <ScrollView>
        {usersRenderer}
      </ScrollView>
    </View>
  )
};
export {PMScreen}

const FindUsersScreen = ({ navigation, route }) => {
  const [loggedIn, setLoggedIn] = useContext(loggedInContext)
  const [textInput, setTextInput] = useState()
  const [foundUsers, setFoundUsers] = useState(null)
  const [foundUserId, setFoundUserId] = useState(null)

  async function searchUsers(input) {
    if (input == undefined) {return}
    let response = await fetch('http://213.100.216.138:8080/search_users', {
          method: 'post',
          body: JSON.stringify({search: input}),
          headers: {
            'Content-Type': 'application/json'
          },
        }
      ).catch(err => {console.log(err);});
      let responseJson = await response.json();
      if (responseJson.result != 'no user found') {
        setFoundUsers(responseJson.result[0])
        setFoundUserId(responseJson.result[1])
      }
  }
  return (
    <View style={styles.groupScreenContainer}>
      <StatusBar style="auto" />
      <TextInput placeholder={"find other users"} onChangeText={(text) => {
        setTextInput(text)
      }}/>
      <Button title="search" onPress={() => {
        searchUsers(textInput)
      }}/>
      { foundUsers!==null ?
      <View style={styles.userContainer}>
        <Text>{foundUsers}</Text>
        <Button title="Send Message" style={styles.userBtn}
        onPress={() =>
          // navigate to conversation
          navigation.navigate('conversation', {user: foundUsers, userId: foundUserId})
        }/>
        <Button title="View Profile" style={styles.userBtn}
        onPress={() =>
          // navigate to profile side
          navigation.navigate('Join Group')
        }/>
      </View> : <Text>no users found yet</Text>
      }
    </View>
  )
};
export {FindUsersScreen}

const ConvScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [inputRef, setInputRef] = useState()
  const [scrollviewRef, setScrollviewRef] = useState(null)
  const [first, setFirst] = useState(true)
  const [closeToBottom, setCloseToBottom] = useState(true)
  const socketRef = useRef()

  async function getMessages() {
    let messagesArray = []
    let response = await fetch('http://213.100.216.138:8080/getConversation', {
        method: 'post',
        body: JSON.stringify({id: route.params.userId}),
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
      }).catch(err => {console.log(err);});
    let responseJson = await response.json();
    await responseJson.messages.forEach((element, i) => {
      messagesArray.push({ message: element.message, from: element.from_, key: i})
    })
    setMessages(messagesArray)
  }
  async function sendMessage(message) {
    let response = await fetch('http://213.100.216.138:8080/sendMsg', {
        method: 'post',
        body: JSON.stringify({
          id: route.params.userId,
          msg: message
        }),
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
      }).catch(err => {console.log(err);});
    let responseJson = await response.json();
    if (responseJson.success) {
      getMessages()
      inputRef.clear()
    }
  }
  const isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
    const paddingToBottom = 20;
    return layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
  };

  useEffect(() => {
    getMessages();
    socketRef.current = io('http://213.100.216.138:8080')
    socketRef.current.on('message', (newMessage) => {
      if (newMessage.from == route.params.userId) {
        getMessages()
      }
    })
  }, []);

  return (
    <>
      <ScrollView 
        ref={ref => { setScrollviewRef(ref) }}
        onContentSizeChange={() => {
          if (first) {
            scrollviewRef.scrollToEnd({animated: false})
            setFirst(false)
          }
          else if (closeToBottom || messages[messages.length - 1].from != route.params.userId) {
            scrollviewRef.scrollToEnd({animated: true})
          }
          else {
            alert("new message")
          }
        }}
        onScroll={({nativeEvent}) => {
          if (isCloseToBottom(nativeEvent)) {
            setCloseToBottom(true)
          }
          else {
            setCloseToBottom(false)
          }
        }}
        >
        <View>
          {messages.map(item => (
            item.from==route.params.userId ? 
            <View key={item.key} style={styles.alignLeft}><Text style={styles.BubbleGray}>{item.message}</Text></View> :
            <View key={item.key} style={styles.alignRight}><Text style={styles.BubbleBlue}>{item.message}</Text></View>
          ))}
        </View>
      </ScrollView>
      <TextInput ref={input => { setInputRef(input) }} placeholder={"send msg"} onChangeText={(text) => {setNewMessage(text)}}/>
      <Button title={"send msg"} onPress={() => {
        sendMessage(newMessage)
      }}/>
    </>
  )
}
export {ConvScreen}

const GroupScreen = ({ navigation, route }) => {
  const [loggedIn, setLoggedIn] = useContext(loggedInContext)
  const [access, setAccess] = useState(false);

  function getAccess() {
    fetch("http://213.100.216.138:8080/getaccess").then((response) => {
      response.json().then((data) => {
        setAccess(data.access)
      })
    }).catch((error) => {console.log(error);})
  }

  useEffect(() => {
    navigation.addListener('focus', () => {
      getAccess()
    });
  },[navigation])

  return (
    <View>
      <StatusBar style="auto" />
      <TouchableHighlight style={styles.joinGroupButton}>
        <Button title="Add Group" style={styles.joinGroupButton}
        onPress={() =>
          navigation.navigate('Join Group')
        }/>
      </TouchableHighlight>
      {access ? <TouchableHighlight style={styles.joinGroupButton}>
        <Button title="Cool Club" style={styles.joinGroupButton}
        onPress={() =>
          navigation.navigate('Cool Club')
        }/>
      </TouchableHighlight>:<></>
    }
    </View>
  )
};
export {GroupScreen}

const JoinGroupScreen = ({ navigation, route }) => {
  return (
    <View style={styles.joinScreenContainer}>
      <StatusBar style="auto" />
      <Text style={styles.text}>Enter group code</Text>
      <TextInput style={styles.joinGroupInput}/>
      <TouchableHighlight style={styles.joinGroupButton}>
        <Button title="Join" style={styles.joinGroupButton}
        onPress={() =>
          navigation.navigate('Group Messages')
        }/>
      </TouchableHighlight>
    </View>
  )
};
export {JoinGroupScreen}

const CoolClubScreen = ({ navigation })=> {
  const [images, setImg] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [imageURI, setImageURI] = useState('');

  const getimages = () => {
    fetch("http://213.100.216.138:8080/getimages").then((response) => {
    response.json().then((data) => {
      data.images.forEach((imageUrl, i) => {
        imageList.push(
          <TouchableOpacity key={i} style={styles.image} onPress={() => {
            setImageURI(`${imageUrl}`)
            setModalVisible(true)
          }}>
            <Image source={{uri: imageUrl}} style={styles.image}/>
          </TouchableOpacity>)
      });
      setImg(imageList);
    })
    .catch(function(error) {
      console.log('There has been a problem with your fetch operation: ' + error.message);
       // ADD THIS THROW error
        throw error;
      });
    })
  }

  const uploadImage = async () => {
    // Opening Document Picker to select one file
    try {
      const image = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      // If file selected then create FormData
      const formData = new FormData();
      const countImages = () => {
        let i = 0;
        images.forEach(_ => { i++ });
        return i+1
      }
      const imageUrl = "file:/" + image.uri.split("file:///").join("")
      formData.append('file', {
        uri: imageUrl,
        type: mime.getType(imageUrl),
        name: 'image' + countImages() + ".png"
      });

      let response = await fetch('http://213.100.216.138:8080/upload', {
          method: 'post',
          body: formData,
          headers: {
            accept: 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
      ).catch(err => {console.log(err);});
      let responseJson = await response.json();
      console.log(responseJson);
      if (responseJson.success) {
        alert('Upload Successful');
        getimages()
      }
    } catch (err) {
      alert('Unknown Error: ' + JSON.stringify(err));
    }
  };
 
  let imageList = [];
  useEffect(() => {
    getimages()
  }, []);

  return(
    <View>
      <StatusBar style="auto" />
      <Modal
        animationType='fade'
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
          <View style={{width: '100%'}}>
            <Image
              source={{uri: imageURI}}
              style={{ 
                width: '100%', 
                height: '100%',
                resizeMode: 'contain',
              }}/>
            <Pressable onPress={() => setModalVisible(!modalVisible)} style={{
              position: 'absolute',
              right: 5,
              top: 5,
            }}>
              <Image source={require("./assets/icons/xicon.png")} style={{width: 30, height: 30}}/>
            </Pressable>
          </View>
        </BlurView>
      </Modal>
      <TouchableOpacity
        style={styles.buttonStyle}
        activeOpacity={0.5}
        onPress={uploadImage}>
        <Text style={styles.uploadPicButton}>Upload File</Text>
      </TouchableOpacity>
      <ScrollView style={styles.scrollView}>
        <View style={styles.imgView}>
          {images}
        </View>
      </ScrollView>
    </View>
  )
};
export {CoolClubScreen}

const styles = StyleSheet.create({
  blurContainer: {
    flex:1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 10
  },
  contentWrap: {
    position: 'absolute',
    zIndex: 1
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalImg: {
    width: '100%',
    height: '90%',
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center"
  },
  imgView: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  convoContainer: {
    borderWidth: 1,
    borderBottomColor: 'grey',
    flexDirection: 'row', 
    alignItems: "center",
    justifyContent: 'flex-start',
    marginBottom: 10,
    paddingLeft: 20,
    paddingVertical: 10
  },
  convoText: {
    marginRight: 20,
  },
  convoButton: {
    textAlign: 'right',
  },
  findFriendsTouch: {
    marginBottom: 10,
    marginTop: 10,
    borderRadius: 30,
    alignItems: 'center',
  },
  findFriendsButton: {
    borderRadius: 50,
  },
  alignLeft: {
    textAlign: 'left',
    flexDirection: 'row', 
    justifyContent: 'flex-start'
  },
  alignRight: {
    flex: 1,
    flexDirection: 'row'
  },
  BubbleBlue: {
    backgroundColor: 'lightblue',
    borderRadius: 20,
    marginLeft: 'auto',
    margin: 10,
    padding: 10
  },
  BubbleGray: {
    backgroundColor: 'lightgrey',
    borderRadius: 20,
    margin: 10,
    padding: 10
  },
  navBarBottom: {
    width: '100%',
    height: '10%',
    backgroundColor: 'grey',
    flexDirection: 'row',
    justifyContent: "space-around",
    alignItems: "center",
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputView: {
    width:"80%",
    backgroundColor:"#2bbfc4",
    borderRadius:25,
    marginBottom:20,
    justifyContent:"center",
    padding:20
  },
  inputText:{
    height:50,
    color:"white"
  },
  forgot:{
    color:"white",
    fontSize:11
  },
  loginBtn:{
    width:"80%",
    backgroundColor:"#fb5b5a",
    borderRadius:25,
    height:50,
    alignItems:"center",
    justifyContent:"center",
    marginTop:40,
    marginBottom:10,
  },
  groupScreenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  joinScreenContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingTop: 20
  },
  joinGroupInput: {
    borderWidth: 1,
    borderColor: '#777',
    padding: 8,
    margin: 10,
    width: '70%',
  },
  joinGroupButton: {
    width: '70%',
    color: '#777',
  },
  addGroupButton: {
    right: 10,
    left: 10,
    position: 'absolute',
    bottom: 10,
  },
  addPicButton: {
    right: 10,
    left: 10,
    position: 'absolute',
    bottom: 10,
  },
  uploadPicButton: {
    fontSize: 20,
    color: 'white',
    marginTop: 5,
  },
  buttonStyle: {
    backgroundColor: '#307ecc',
    borderWidth: 0,
    color: '#FFFFFF',
    borderColor: '#307ecc',
    height: 40,
    alignItems: 'center',
    borderRadius: 30,
    marginLeft: 35,
    marginRight: 35,
    marginTop: 15,
    marginBottom: 15,
  },
  text: {
    fontSize: 32,
  },
  image: {
    width: 100,
    height: 100,
    margin: 5
  },
  marginBottom: {
    marginBottom: 20,
  },
  userContainer: {
    width: '80%',
    height: '20%',
    flexDirection: 'row',
    justifyContent: "space-around",
    alignItems: "center",
  },
  userBtn: {
    width: '20%'
  }
});