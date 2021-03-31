/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type Event = {
  __typename: "Event",
  result?: string,
};

export type petReport = {
  __typename: "petReport",
  email?: string,
  phoneNo?: string,
  inputOne?: string,
  inputTwo?: string,
};

export type PetFormMutationVariables = {
  name?: string,
  description?: string,
};

export type PetFormMutation = {
  petForm:  {
    __typename: "Event",
    result: string,
  },
};

export type GetReportQuery = {
  getReport?:  Array< {
    __typename: "petReport",
    email: string,
    phoneNo: string,
    inputOne: string,
    inputTwo: string,
  } | null > | null,
};
