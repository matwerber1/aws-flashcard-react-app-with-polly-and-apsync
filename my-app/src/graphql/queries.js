// eslint-disable
// this is an auto generated file. This will be overwritten
/*
export const listCards = `query ListCards {
    listCards {
        card_id
        front_text
        back_text
        back_audio
    }
}
`;
*/

export const getCard = `query getCard($card_id: ID!) {
    listCards(card_id: $card_id) {
        card_id,
        front_text,
        back_text,
        back_audio
    }
}
`;

export const listTodos = `query ListTodos(
    $filter: ModelTodoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTodos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        description
      }
      nextToken
    }
  }
  `;

  export const listCards = `query ListCards(
    $filter: ModelCardFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCards(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        card_id
        front_text
        back_text
        back_audio
      }
      nextToken
    }
  }
  `;