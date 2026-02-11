from services.supabase_service import supabase_service

def test_prompts_table():
    try:
        if not supabase_service or not supabase_service.client:
            print("ERROR: Supabase service not initialized")
            return
        
        print("Testing prompts table...")
        
        # Test insert
        test_data = {
            'title': 'Test2 Prompt',
            'description': 'Test2 Description',
            'type': 'speaking',
            'difficulty': 'beginner',
            'level': 'A2',
            'status': 'active'
        }
        
        print(f"Inserting test data: {test_data}")
        insert_response = supabase_service.client.table('prompts').insert(test_data).execute()
        print(f"Insert response: {insert_response}")
        
        # Test select
        print("Selecting all prompts...")
        select_response = supabase_service.client.table('prompts').select('*').execute()
        print(f"Select response: {select_response}")
        print(f"Data count: {len(select_response.data)}")
        
        for prompt in select_response.data:
            print(f"Prompt: {prompt}")
            
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_prompts_table()