Sequel.migration do
  up do
    alter_table :users do
      rename_column :login, :username
    end
  end

  down do
    alter_table :users do
      rename_column :username, :login
    end
  end
end

