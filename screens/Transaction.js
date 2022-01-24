import React, { Component } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  ToastAndroid,
  Alert
} from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import db from "../config";
import firebase from 'firebase/compat/app';

const bgImage = require("../assets/background2.png");
const appIcon = require("../assets/appIcon.png");
const appName = require("../assets/appName.png");

export default class TransactionScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bookId: "",
      studentId: "",
      domState: "normal",
      hasCameraPermissions: null,
      scanned: false
    };
  }

  getCameraPermissions = async domState => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" é verdadeiro se o usuário concedeu permissão
          status === "granted" é falso se o usuário não concedeu permissão
        */
      hasCameraPermissions: status === "granted",
      domState: domState,
      scanned: false
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    const { domState } = this.state;

    if (domState === "bookId") {
      this.setState({
        bookId: data,
        domState: "normal",
        scanned: true
      });
    } else if (domState === "studentId") {
      this.setState({
        studentId: data,
        domState: "normal",
        scanned: true
      });
    }
  };

  handleTransaction=async ()=>{
    var {bookId, studentId}=this.state
    await this.getBookDetails(bookId)
    await this.getStudentDetails(studentId)
    var transactionType = await this.checkBook(bookId)
    var {bookName,studentName} = this.state
    if(!transactionType){
      this.setState({
        bookId:'',
        studentId:''
      });
      ToastAndroid.show("Livro não tem na biblioteca",ToastAndroid.SHORT)
    } else if(transactionType === "issue" || transactionType === "return"){
      var studentExist = await this.checkStudent(studentId)
      console.log(transactionType) 
      console.log(studentExist)
      if(studentExist){
        if(transactionType === "issue"){
          this.initiateBookIssue(bookId,studentId,bookName,studentName);
          ToastAndroid.show("livro emprestado" , ToastAndroid.SHORT, ToastAndroid.CENTER)
        }else{
          console.log("olla")
          this.initiateBookReturn(bookId,studentId,bookName,studentName);
          ToastAndroid.show("livro devolvido", ToastAndroid.SHORT, ToastAndroid.CENTER)  
        }
      }
    }
    // else if(transactionType ===  "issue"){
    //   var studentExist = await this.checkStudent(studentId)
    //   if(studentExist){
    //     this.initiateBookIssue(bookId,studentId,bookName,studentName);
    //     ToastAndroid.show("livro emprestado" , ToastAndroid.SHORT, ToastAndroid.CENTER)
    //   }
    // } else{
    //   var studentExist = await this.checkStudent(studentId)
    //   if(studentExist){
    //     this.initiateBookReturn(bookId,studentId,bookName,studentName);
    //     ToastAndroid.show("livro devolvido", ToastAndroid.SHORT, ToastAndroid.CENTER)  
    //   }
    // }
  }

  initiateBookIssue=async(bookId,studentId,bookName,studentName)=>{
    db.collection('transactions').add({
      book_id:bookId,
      book_name:bookName,
      date:firebase.firestore.Timestamp.now().toDate(),
      student_id:studentId,
      student_name:studentName,
      transaction_tip:'issue',
    })
    db.collection('books').doc(bookId).update({
      is_book_available: false,
    })
    db.collection('students').doc(studentId).update({
      number_of_book_issued:firebase.firestore.FieldValue.increment(1)
    })
    this.setState({
      bookId: "",
      studentId: "",
    })
  }
  initiateBookReturn=async(bookId,studentId,bookName,studentName)=>{
    console.log('oi', studentName, studentId)
    db.collection('transactions').add({
      book_id:bookId,
      book_name:bookName,
      date:firebase.firestore.Timestamp.now().toDate(),
      student_id:studentId,
      student_name:studentName,
      transaction_tip:'return',
    })
    db.collection('books').doc(bookId).update({
      is_book_available: true,
    })
    db.collection('students').doc(studentId).update({
      number_of_book_issued:firebase.firestore.FieldValue.increment(-1)
    })
    this.setState({
      bookId: "",
      studentId: "",
    })
  }

  getBookDetails=bookId=>{
    this.setState({
      bookName: ''
    })
    bookId = bookId.trim();
    db.collection('books')
    .where("book_id","==",bookId)
    .get()
    .then(snapshot=>{
      snapshot.docs.map(doc=>{
        this.setState({
          bookName: doc.data().book_name
        })
      })
    })
  }
  getStudentDetails=studentId=>{
    this.setState({
      studentName: ''
    })
    studentId = studentId.trim();
    db.collection('students')
    .where("student_id","==",studentId)
    .get()
    .then(snapshot=>{
      snapshot.docs.map(doc=>{
        this.setState({
          studentName: doc.data().student_name
        })
      })
      
    })

  }

  checkBook=async bookId=>{
    const bookRef = await db.collection('books')
    .where("book_id","==",bookId)
    .get()
    var transactionType = ''
    if(bookRef.docs.length == 0){
      transactionType = false;
    }else{
      bookRef.docs.map(doc=>{
        transactionType = doc.data().is_book_available?"issue":"return"
      })
    }
    return transactionType
  }
  checkStudent=async studentId=>{
    const studentRef = await db.collection('students')
    .where("student_id","==",studentId)
    .get()
    var studentExist = '';
    if(studentRef.docs.length == 0){
      studentExist=false;
      this.setState({
        bookId:'',
        studentId:''
      })
      ToastAndroid.show("Aluno não existe", ToastAndroid.SHORT);
    }else {
      studentRef.docs.map(doc=>{
        if(doc.data().number_of_book_issued < 2){
          studentExist = true
        }else{
          studentExist = false
          ToastAndroid.show("O aluno possui 2 livros emprestados", ToastAndroid.SHORT)
          this.setState({
            bookId:'',
            studentId:''
          })
        }
      })
    }
    return studentExist
  }

  render() {
    const { bookId, studentId, domState, scanned } = this.state;
    if (domState !== "normal") {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <ImageBackground source={bgImage} style={styles.bgImage}>
          <View style={styles.upperContainer}>
            <Image source={appIcon} style={styles.appIcon} />
            <Image source={appName} style={styles.appName} />
          </View>
          <View style={styles.lowerContainer}>
            <View style={styles.textinputContainer}>
              <TextInput
                style={styles.textinput}
                placeholder={"Id Livro"}
                placeholderTextColor={"#FFFFFF"}
                value={bookId}
                onChangeText={text=>this.setState({
                  bookId:text
                })}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("bookId")}
              >
                <Text style={styles.scanbuttonText}>Digitalizar</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.textinputContainer, { marginTop: 25 }]}>
              <TextInput
                style={styles.textinput}
                placeholder={"Id aluno"}
                placeholderTextColor={"#FFFFFF"}
                value={studentId}
                onChangeText={text=>this.setState({
                  studentId:text
                })}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("studentId")}
              >
                <Text style={styles.scanbuttonText}>Digitalizar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.button,{marginTop:25}]} onPress={this.handleTransaction}>
                <Text style={styles.buttonText}>enviar</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  bgImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center"
  },
  upperContainer: {
    flex: 0.5,
    justifyContent: "center",
    alignItems: "center"
  },
  appIcon: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: 80
  },
  appName: {
    width: 80,
    height: 80,
    resizeMode: "contain"
  },
  lowerContainer: {
    flex: 0.5,
    alignItems: "center"
  },
  textinputContainer: {
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: "row",
    backgroundColor: "#9DFD24",
    borderColor: "#FFFFFF"
  },
  textinput: {
    width: "57%",
    height: 50,
    padding: 10,
    borderColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 3,
    fontSize: 18,
    backgroundColor: "#5653D4",
    fontFamily: "Rajdhani_600SemiBold",
    color: "#FFFFFF"
  },
  scanbutton: {
    width: 100,
    height: 50,
    backgroundColor: "#9DFD24",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  scanbuttonText: {
    fontSize: 24,
    color: "#0A0101",
    fontFamily: "Rajdhani_600SemiBold"
  },
  button:{
    width:'43%',
    height:55,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor:'#f48d20',
    borderRadius:15
  },
  buttonText:{
    fontSize:24,
    color: '#fff',
    fontFamily:"Rajdhani_600SemiBold"
  }
});
