import ActionTypes from '../../utils/constants/actionTypes'
import firebase from '../../utils/firebase.ts'

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
  )
}

export function addHabit() {
  return (dispatch, getState, getFirebase) => {
    const uid = firebase.auth().currentUser.uid
    const habit = getState().firebase.newHabit
    // generate id
    const habitId = habit.title + '-' + uuidv4()
    // make async call to db
    const db = getFirebase().firestore()
    db.collection('habits')
      .doc(habitId)
      .set({
        ...habit,
        id: habitId,
        color: {
          //TODO: fix color in NewHabit
          r: 255,
          g: 0,
          b: 0,
        },
        streakAmt: 0,
        lastEdit: Date(),
        createdAt: Date(),
        createdBy: '',
        editedBy: [''],
        owner: '',
        sequence: '',
        previous: '',
        next: '',
        version: {
          parent: '',
          children: [''],
        },
      })
      .then((data) => {
        var habitIdList = getState().firebase.userData.habits
        habitIdList.push(habitId)
        // then update user data
        db.collection('users') // user collection
          .doc(uid) // select document with uid
          .update({
            habits: habitIdList,
          }) // update document with new sequence id list
          .then((_) => {
            dispatch({ type: ActionTypes.ADD_SEQUENCE })
            dispatch(getUserData())
          }) // then dispatch the action and reload the user data
          .catch((err) => dispatch({ type: ActionTypes.ADD_SEQUENCE_ERR, payload: err })) // or catch the error
      })
      .catch((err) => {
        dispatch({ type: ActionTypes.ADD_HABIT_ERR, err })
      })
  }
}

export function getHabits() {
  return (dispatch, getState, getFirebase) => {
    // Get list of habits form state
    const habitIdList = getState().firebase.userData.habits ? getState().firebase.userData.habits : []
    // make async call to db
    const db = getFirebase().firestore()
    // Initialize list of habits to send to reducer
    var habitList = []
    // For every habit id that user owns, retrieve the document of
    // the same name and add it to the list of habits.
    habitIdList.forEach((habitId, i) =>
      db
        .collection('habits')
        .doc(habitId)
        .get()
        .then((habit) => {
          // Push the data of the habit document to the list of habits
          habitList.push(habit.data())
          // Then send the list of retrieved habit documents to the reducer once we've reached the end of the list of habit ids
          if (i + 1 === habitIdList.length) dispatch({ type: ActionTypes.GET_HABITS, payload: habitList })
        })
        .catch((err) => dispatch({ type: ActionTypes.GET_HABITS_ERR, err })),
    )
  }
}

export function bulkAddHabits(habits) {
  return (dispatch, getState, getFirebase) => {
    // make async call to db
    const db = getFirebase().firestore()
    habits.forEach((habit) => {
      // generate id
      const habitId = habit.title + '-' + uuidv4()
      db.collection('habits')
        .doc(habitId)
        .set({
          ...habit,
          id: habitId,
          lastEdit: new Date(), //TODO: make this firebase db timestamp
          createdAt: new Date(), //TODO: make this firebase db timestamp
        })
        .then((_data) => {
          dispatch({ type: ActionTypes.BULK_ADD_HABITS })
          dispatch(getHabits())
        })
        .catch((err) => dispatch({ type: ActionTypes.ADD_HABIT_ERR, err }))
    })
  }
}

export function onNewHabitChange(color, icon, title, cue, routine, reward, streak, xp, rp, coolDownAmt, coolDownUnit) {
  return (dispatch) =>
    dispatch({
      type: ActionTypes.ON_NEW_HABIT_CHANGE,
      payload: { color, icon, title, cue, routine, reward, streak, xp, rp, coolDownAmt, coolDownUnit },
    })
}

export function deleteHabit(habitId) {
  return (dispatch, getState, getFirebase) => {
    const uid = firebase.auth().currentUser.uid // get current user's uid
    const db = getFirebase().firestore() // initialize db
    db.collection('users') // select users collection
      .doc(uid) // select user document
      .update(
        // update sequence list with trimmed list
        {
          habits: getState().firebase.userData.habits.filter((habit) => habit !== habitId),
        },
      )
      .then((_data) => {
        dispatch({ type: ActionTypes.DELETE_HABIT })
        dispatch(getUserData())
      }) // then dispatch the action and reload from db
      .catch((err) => dispatch({ type: ActionTypes.DELETE_HABIT_ERR, err: err })) // or catch the error
  }
}

// Update Habit on Firestore
export function updateHabit(habitId) {
  return (dispatch, getState, getFirebase) => {
    const habit = getState().firebase.newHabit
    const db = getFirebase().firestore() // initialize db
    db.collection('habits') // select habits collection
      .doc(habitId) // select habit
      .update({
        ...habit,
        lastEdit: new Date(), //TODO: make this firebase db timestamp
      }) // update habit
      .then((_) => {
        dispatch({ type: ActionTypes.UPDATE_HABIT })
        dispatch(getHabits())
      }) // then dispatch the action and reload from db
      .catch((err) => dispatch({ type: ActionTypes.UPDATE_HABIT_ERR, err: err })) // or catch the error
  }
}

export function loadHabitEditor(habitId) {
  return (dispatch, getState, getFirebase) => {
    const db = getFirebase().firestore()
    db.collection('habits') // habits collection
      .doc(habitId) // select habit document based on id
      .get() // get data
      .then((habit) => {
        dispatch({ type: ActionTypes.LOAD_HABIT_EDITOR, payload: habit })
      }) // then dispatch load action
      .catch((err) => {
        dispatch({ type: ActionTypes.GET_HABITS_ERR, err })
      }) // or catch error
  }
}

export function resetHabitEditor() {
  return (dispatch, getState) => {
    dispatch({ type: ActionTypes.RESET_HABIT_EDITOR })
  }
}

// SEQUENCES
export function getSequences() {
  return (dispatch, getState, getFirebase) => {
    // Get list of sequences form state
    const sequenceIdList = getState().firebase.userData.sequences ? getState().firebase.userData.sequences : []
    // make async call to db
    const db = getFirebase().firestore()
    // Initialize list of sequences to send to reducer
    var sequenceList = []
    // For every sequence id that user owns, retrieve the document of
    // the same name and add it to the list of sequences.
    sequenceIdList.forEach((sequenceId, i) =>
      db
        .collection('sequences')
        .doc(sequenceId)
        .get()
        .then((sequence) => {
          // Push the data of the sequence document to the list of sequences
          sequenceList.push(sequence.data())
          // Then send the list of retrieved sequence documents to the reducer once we've reached the end of the list of sequence ids
          if (i + 1 === sequenceIdList.length) dispatch({ type: ActionTypes.GET_SEQUENCES, payload: sequenceList })
        })
        .catch((err) => dispatch({ type: ActionTypes.GET_SEQUENCES_ERR, err })),
    )
  }
}

export function updateSequence(sequenceId) {
  return (dispatch, getState, getFirebase) => {
    const sequence = getState().firebase.newSequence // get new sequence parameters from state
    const db = getFirebase().firestore() // connect to firestore
    db.collection('sequences') // sequences collection
      .doc(sequenceId) // select document with id
      .update({
        ...sequence,
        lastEdit: new Date(), //TODO: make this firebase db timestamp
      }) // update document with new sequence parameters
      .then((_) => {
        dispatch({ type: ActionTypes.UPDATE_SEQUENCE })
        dispatch(getSequences())
      }) // then dispatch the action and reload the sequences
      .catch((err) => dispatch({ type: ActionTypes.UPDATE_SEQUENCE_ERR, payload: err })) // or catch the error
  }
}

export function addSequence() {
  return (dispatch, getState, getFirebase) => {
    const uid = firebase.auth().currentUser.uid
    const sequence = getState().firebase.newSequence // get new sequence parameters from state
    const sequenceId = sequence.title + '-' + uuidv4() // generate sequnce id
    const db = getFirebase().firestore() // connect to firestore
    db.collection('sequences') // sequences collection
      .doc(sequenceId) // select document with id
      .set({
        ...sequence,
        id: sequenceId,
        lastEdit: new Date(), //TODO: make this firebase db timestamp
        createdAt: new Date(), //TODO: make this firebase db timestamp
      }) // update document with new sequence parameters
      .then((_) => {
        var sequenceIdList = getState().firebase.userData.sequences
        sequenceIdList.push(sequenceId)
        // then update user data
        db.collection('users') // user collection
          .doc(uid) // select document with uid
          .update({
            sequences: sequenceIdList,
          }) // update document with new sequence id list
          .then((_) => {
            dispatch({ type: ActionTypes.ADD_SEQUENCE })
            dispatch(getUserData())
          }) // then dispatch the action and reload the user data
          .catch((err) => dispatch({ type: ActionTypes.ADD_SEQUENCE_ERR, payload: err })) // or catch the error
      }) // then dispatch the action and reload the sequences
      .catch((err) => dispatch({ type: ActionTypes.ADD_SEQUENCE_ERR, payload: err })) // or catch the error
  }
}

export function bulkAddSequences(sequences) {
  return (dispatch, getState, getFirebase) => {
    const db = getFirebase().firestore() // connect to firestore
    sequences.forEach((sequence) => {
      const sequenceId = sequence.title + '-' + uuidv4() // generate sequnce id
      db.collection('sequences') // sequences collection
        .doc(sequenceId) // select document with id
        .set({
          ...sequence,
          id: sequenceId,
          lastEdit: new Date(), //TODO: make this firebase db timestamp
          createdAt: new Date(), //TODO: make this firebase db timestamp
        }) // update document with new sequence parameters
        .then((_) => {
          dispatch({ type: ActionTypes.BULK_ADD_SEQUENCES })
          dispatch(getSequences())
        }) // then dispatch the action and reload the sequences
        .catch((err) => dispatch({ type: ActionTypes.BULK_ADD_SEQUENCES_ERR, payload: err })) // or catch the error
    })
  }
}

export function deleteSequence(sequenceId) {
  return (dispatch, getState, getFirebase) => {
    const uid = firebase.auth().currentUser.uid
    const db = getFirebase().firestore() // connect to firestore
    db.collection('users') // sequences collection
      .doc(uid) // select user document
      .update(
        // update sequence list with trimmed list
        {
          sequences: getState().firebase.userData.sequences.filter((sequence) => sequence !== sequenceId),
        },
      )
      .then(() => {
        dispatch({ type: ActionTypes.DELETE_SEQUENCE })
        dispatch(getUserData())
      }) // then dispatch the action and reload the sequences
      .catch((err) => dispatch({ type: ActionTypes.DELETE_SEQUENCE_ERR, payload: err })) // or catch the error
  }
}

export function loadSequenceEditor(id) {
  return (dispatch, getState, getFirebase) => {
    const db = getFirebase().firestore()
    db.collection('sequences') // sequences collection
      .doc(id) // select sequence document based on id
      .get() // get data
      .then((sequence) => {
        dispatch({ type: ActionTypes.LOAD_SEQUENCE_EDITOR, payload: sequence })
      }) // then dispatch load action
      .catch((err) => {
        dispatch({ type: ActionTypes.GET_SEQUENCES_ERR, err })
      }) // or catch error
  }
}

export function resetSequenceEditor() {
  return (dispatch) => {
    dispatch({ type: ActionTypes.RESET_SEQUENCE_EDITOR })
  }
}

export function onNewSequenceChange(title, coolDownAmt, coolDownUnit, habitList) {
  return (dispatch) => {
    const habits = habitList
    dispatch({
      type: ActionTypes.ON_NEW_SEQUENCE_CHANGE,
      payload: { title, coolDownAmt, coolDownUnit, habits },
    })
  }
}

export function getUserData() {
  return (dispatch, getState, getFirebase) => {
    const db = getFirebase().firestore()
    const currentUser = firebase.auth().currentUser
    if (firebase.auth())
      db.collection('users') // users collection
        .doc(currentUser.uid) // select user document based on id
        .get() // get data
        .then((userData) => {
          dispatch({
            type: ActionTypes.GET_USER_STATS,
            payload: {
              sequences: userData.data().sequences,
              habits: userData.data().habits,
              email: currentUser.email,
              emailVerified: currentUser.emailVerified,
              lastSignInTime: currentUser.metadata.lastSignInTime,
              creationTime: currentUser.metadata.creationTime,
              photoURL: currentUser.photoURL,
              displayName: currentUser.displayName,
            },
          })
          dispatch(getHabits())
          dispatch(getSequences())
        }) // then dispatch action with desired stats
        .catch((err) => {
          dispatch({ type: ActionTypes.GET_USER_STATS_ERR, err })
        }) // or catch error
  }
}

export function deleteUser() {
  return (dispatch, getState, getFirebase) => {
    const uid = firebase.auth().currentUser.uid
    const db = getFirebase().firestore()
    // Set deleted property on user document
    db.collection('users') // users collection
      .doc(uid) // select user document based on id
      .set({
        deleted: Date(),
      }) // set deleted property on user
      .then((userData) => {
        // Delete user function
        var deleteUser = firebase.functions().httpsCallable('deleteUser')
        deleteUser(uid)
          // Logout
          .then(() => firebase.auth().signOut())
          .catch((err) => dispatch({ type: ActionTypes.DELETE_USERS_ERR, err }))
        dispatch({ type: ActionTypes.DELETE_USER })
      }) // then dispatch action
      .catch((err) => dispatch({ type: ActionTypes.DELETE_USERS_ERR, err })) // or catch error
  }
}
