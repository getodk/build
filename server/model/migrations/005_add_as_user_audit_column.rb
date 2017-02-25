Sequel.migration do
  up do
    alter_table :login_audit do
      add_foreign_key :as_user, :users
    end
  end

  down do
    alter_table :users do
      drop_column :as_user
    end
  end
end

