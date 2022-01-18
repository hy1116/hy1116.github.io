import {firebaseApp,authService} from './firebase'

function Auth(props) {
  authService.createUserWithEmailAndPassword(props.email, props.password)
  //signInWithEmailAndPassword(props.email, props.password)
  .then((userCredential) => {
    // Signed in
    console.log("login tried");
    const user = userCredential.user;
    console.log(user);
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    // ..
  });
  return(
    <></>
  )
};
export default Auth;