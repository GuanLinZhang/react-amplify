/* src/App.js */
import React, { useEffect, useState } from "react";
import Amplify, { API, graphqlOperation, Auth } from "aws-amplify";
// import { withAuthenticator } from "@aws-amplify/ui-react";
import { createTodo } from "./graphql/mutations";
import { listTodos } from "./graphql/queries";
import "@aws-amplify/ui-react/styles.css";
import awsExports from "./aws-exports";
import axios from "axios";

Amplify.configure(awsExports);

const initialState = { name: "", description: "" };
// const initialState = {
//   username: "", password: "", email: "", authCode: '', formType: "signUp"
// }

const App = () => {
  const [formState, setFormState] = useState(initialState);
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    fetchTodos();
    // login();
  }, []);

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value });
  }

  async function fetchTodos() {
    try {
      const todoData = await API.graphql(graphqlOperation(listTodos));
      const todos = todoData.data.listTodos.items;
      setTodos(todos);
    } catch (err) {
      console.log("error fetching todos");
    }
  }

  async function login() {
    try {
      let d = {};
      let userId = "guanlinz";
      let formData = {
        userId: userId,
      };
      axios
        .post(`http://localhost:8080/auth`, JSON.stringify(formData))
        .then((res) => {
          const data = res.data;
          d = data;

          let token = d.token;
          let identityId = d.identityId;
          let expires_at = d.duration * 1000 + new Date().getTime();

          Auth.federatedSignIn("cognito-identity.amazonaws.com", {
            token,
            identityId, // Optional
            expires_at, // the expiration timestamp
          })
            .then((cred) => {
              // If success, you will get the AWS credentials
              console.log(cred);
              return Auth.currentAuthenticatedUser();
            })
            .then((user) => {
              // If success, the user object you passed in Auth.federatedSignIn
              console.log(user);
            })
            .catch((e) => {
              console.log(e);
            });
        });
    } catch (error) {}
  }

  async function addTodo() {
    try {
      if (!formState.name || !formState.description) return;
      const todo = { ...formState };
      setTodos([...todos, todo]);
      setFormState(initialState);
      await API.graphql(graphqlOperation(createTodo, { input: todo }));
    } catch (err) {
      console.log("error creating todo:", err);
    }
  }

  return (
    <div style={styles.container}>
      <h2>Amplify Todos</h2>
      <input
        onChange={(event) => setInput("name", event.target.value)}
        style={styles.input}
        value={formState.name}
        placeholder="Name"
      />
      <input
        onChange={(event) => setInput("description", event.target.value)}
        style={styles.input}
        value={formState.description}
        placeholder="Description"
      />
      <button style={styles.button} onClick={addTodo}>
        Create Todo
      </button>
      {todos.map((todo, index) => (
        <div key={todo.id ? todo.id : index} style={styles.todo}>
          <p style={styles.todoName}>{todo.name}</p>
          <p style={styles.todoDescription}>{todo.description}</p>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    width: 400,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: 20,
  },
  todo: { marginBottom: 15 },
  input: {
    border: "none",
    backgroundColor: "#ddd",
    marginBottom: 10,
    padding: 8,
    fontSize: 18,
  },
  todoName: { fontSize: 20, fontWeight: "bold" },
  todoDescription: { marginBottom: 0 },
  button: {
    backgroundColor: "black",
    color: "white",
    outline: "none",
    fontSize: 18,
    padding: "12px 0px",
  },
};

export default App;
