import React,{useState} from "react";
import { TextField, Container, Button } from "@material-ui/core";
import { API } from "aws-amplify";
import { petForm } from '../graphql/mutations';
const style = require('./index.module.css')

export default function Home() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState("")


  return (
    <div className={style.main_div} >
     
     {/* <div className={style.second_div} > */}
     <h1>Pet Theory System</h1>
     <div>
        <TextField type="text" variant='outlined' color='secondary'
          label='Name' value={name} onChange={(e) => {
            setName(e.target.value)
          }} />
      </div>

      <div>
        <TextField style={{marginTop:"20px"}} multiline rows={7} type="text" value={description} variant='outlined' color='secondary'

          label='Mail' onChange={(e) => {
            setDescription(e.target.value)
          }} />
      </div>

      <div>
        <Button style={{marginTop:"20px"}} variant='outlined' color='primary' onClick={async () => {
          await API.graphql({
            query: petForm,
            variables: {
              name: name,
              description: description
            }
          })
          setName('')
          setDescription('')

        }} >send Email</Button>
      </div>
     </div>

    // </div>
  )

}
