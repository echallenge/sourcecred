// @flow

import React from "react";
import {Admin, Resource, ListGuesser, EditGuesser, Loading} from "react-admin";
import {
  InitiativeList,
  InitiativeCreate,
  InitiativeEdit,
} from "./components/Initiatives";
import fakeDataProvider from "ra-data-fakerest";
import {createMemoryHistory} from "history";
import {createMuiTheme} from "@material-ui/core/styles";
import {Graph, type Node} from "../core/graph";
import {fakeInitiatives} from "./mock/fakeInitiatives";

async function loadAndReport(path: string) {
  const response = await fetch(path);
  if (!response.ok) {
    console.error(path, response);
  }
  return response.json();
}

function loadUsers(plugins, graph): Array<Object> {
  const userPrefixes = plugins.reduce((acc, {userTypes}) => {
    userTypes.forEach((type) => acc.push(type.prefix));
    return acc;
  }, []);
  const users = [];
  userPrefixes.forEach((prefix) => {
    const userIterator = graph.nodes({prefix});
    let nextUser = userIterator.next();
    while (!nextUser.done) {
      const user = {
        ...nextUser.value,
      };
      users.push(user); // find a way to return users, possibly refactor
      nextUser = userIterator.next();
    }
  });
  return users;
}

function loadActivities(plugins, graph): Array<Object> {
  const activityPrefixes = plugins.reduce((acc, {nodeTypes}) => {
    nodeTypes.forEach(
      (type) =>
        !["Bot", "User", "Identity", "Like"].find((n) => n === type.name) &&
        acc.push(type.prefix)
    );
    return acc;
  }, []);
  const activities = [];
  activityPrefixes.forEach((prefix) => {
    const activityIterator = graph.nodes({prefix});
    let nextActivity = activityIterator.next();
    while (!nextActivity.done) {
      const activity = {
        ...nextActivity.value,
      };
      activities.push(activity); // find a way to return activities here, possibly refactor
      nextActivity = activityIterator.next();
    }
  });
  return activities;
}

const dataProvider = fakeDataProvider(fakeInitiatives, true);

const history = createMemoryHistory();

const theme = createMuiTheme({
  palette: {
    type: "dark",
  },
});

export type AppState = {|
  graph: ?Graph,
  plugins: ?Object,
  users: Node[],
  activities: Node[],
  loaded: boolean,
|};

export default class App extends React.Component<{||}, AppState> {
  constructor(props: Object) {
    super(props);
    this.state = {
      graph: null,
      plugins: null,
      users: [],
      activities: [],
      loaded: false,
    };
  }
  async componentDidMount() {
    const [
      ,
      {
        weightedGraph: [, {graphJSON}],
        plugins: [, plugins],
      },
    ] = await loadAndReport("output/credResult.json");
    const graph = Graph.fromJSON(graphJSON);
    const users = loadUsers(plugins, graph);
    const activities = loadActivities(plugins, graph);
    this.setState({
      graph,
      plugins,
      users,
      activities,
      loaded: true,
    });
  }

  render() {
    if (!this.state.loaded)
      return (
        <Loading
          loadingPrimary="Fetching cred details..."
          loadingSecondary="Your patience is appreciated"
        />
      );
    return (
      <Admin theme={theme} dataProvider={dataProvider} history={history}>
        <Resource
          name="initiatives"
          list={InitiativeList}
          create={InitiativeCreate(this.state)}
          edit={InitiativeEdit(this.state)}
        />
        <Resource name="people" list={ListGuesser} edit={EditGuesser} />
        <Resource name="comments" list={ListGuesser} edit={EditGuesser} />
      </Admin>
    );
  }
}
