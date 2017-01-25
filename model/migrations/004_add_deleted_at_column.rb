Sequel.migration do
  up do
    alter_table :forms do
      add_column :deleted_at, DateTime
    end
  end

  down do
    alter_table :forms do
      drop_column :deleted_at
    end
  end
end

