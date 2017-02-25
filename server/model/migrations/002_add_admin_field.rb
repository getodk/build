Sequel.migration do
  up do
    alter_table :users do
      add_column :admin, TrueClass
    end
  end

  down do
    alter_table :users do
      drop_column :admin
    end
  end
end

