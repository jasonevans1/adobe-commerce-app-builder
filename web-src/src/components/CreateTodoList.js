/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Flex, Form, TextField, Button } from '@adobe/react-spectrum';

function CreateTodoList({ onCreate }) {
  const [todoListName, setTodoListName] = useState('');

  return (
    <Form
      onSubmit={async (event) => {
        event.preventDefault();

        onCreate && (await onCreate(todoListName));
      }}>
      <Flex alignItems="flex-end" justifyContent="center" gap="size-100">
        <TextField
          value={todoListName}
          onChange={(value) => {
            setTodoListName(value);
          }}
          label="Todo list"
          placeholder="Name"
        />
        <Button type="submit" variant="cta">
          Create
        </Button>
      </Flex>
    </Form>
  );
}

CreateTodoList.propTypes = {
  onCreate: PropTypes.func
};

export { CreateTodoList };
