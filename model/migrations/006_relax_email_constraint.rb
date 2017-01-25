Sequel.migration do
  up do
    alter_table :users do
      drop_constraint :users_email_key
    end
  end

  down do
    alter_table :users do
      add_unique_constraint :users_email_key
    end
  end
end

