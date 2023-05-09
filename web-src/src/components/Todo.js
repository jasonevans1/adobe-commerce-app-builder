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
import { Flex, Checkbox, TextField } from '@adobe/react-spectrum';
import PropTypes from 'prop-types';

function Todo({ name, todo, onUpdate }) {
  const [value, setValue] = useState(todo.value);
  const [isDone, setIsDone] = useState(todo.done);

  return (
    <Flex gap="size-100">
      <Checkbox
        aria-label="done"
        isSelected={isDone}
        onChange={async (value) => {
          todo.done = value;
          setIsDone(value);

          onUpdate && (await onUpdate(name, todo));
        }}
        isEmphasized
        value={value}
      />
      <TextField
        isDisabled={isDone}
        aria-label="Todo"
        width="100%"
        value={value}
        onChange={async (value) => {
          todo.value = value;
          setValue(value);

          onUpdate && (await onUpdate(name, todo));
        }}
        isQuiet
      />
    </Flex>
  );
}

Todo.propTypes = {
  name: PropTypes.string,
  todo: PropTypes.object,
  onUpdate: PropTypes.func
};

export { Todo };
